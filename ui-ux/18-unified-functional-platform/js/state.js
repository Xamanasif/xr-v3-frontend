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

     Implementation 04
     · questions[]      — QuestionBankItem  (tenant-scoped, Faculty-owned)
     · assessmentDefs[] — AssessmentDefinition (tenant + Experiment)
     · reviews[]        — DescriptiveReview (one per attempt + descriptive question)
     · facultyPrefs     — Faculty workflow preference (review assistance)

     Implementation 05 — content production
     · contentRecords[]        — THE CANONICAL EXPERIMENT POOL. One
                                 truth: seeded from data.EXPERIMENTS as
                                 EXISTING PUBLISHED CONTENT and then
                                 owned by the production workflow. Every
                                 catalogue lookup in data.js resolves
                                 against the PUBLISHED subset of this.
     · academicReviews[]       — every academic decision (approve /
                                 changes requested), with the Learning
                                 Outcomes as they stood at the decision
     · publicationRecords[]    — FIRST PUBLICATION records
     · contentActors[]         — prototype Vendor / Academic Reviewer /
                                 Content Manager identities
     · contentRoleAssignments[]— per-Course / per-Experiment role scope
                                 (STK31-41), standing in for the Super
                                 Admin governance UI of a later slice

   StudentEntitlement is DERIVED, never stored — the model
   `17_CONCEPTUAL_DATA_AND_STATE_MODEL.md` §4 requires
   (“DERIVED LEARNER ELIGIBILITY ← never stored”). Deriving it is
   also the only way the multi-source rules below stay correct:
   one effective entitlement, several assignment sources, and
   removing one source never removes an entitlement another source
   still supports.

   ── THE THREE ALTITUDES (must never collapse) ────────────────
        PUBLISHED            contentRecords[] — Content Manager
                             publishes (STK31-06). Publishing writes
                             ONLY the content record: no access[] row,
                             no licence change, no assignment.
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
  /* SCHEMA 10 — Implementation 07.2, the stakeholder-confirmed
     corrections. Three PURELY ADDITIVE fields, no collection added, no
     row removed, no namespace change:
       · courses[].code                — the canonical Course Code (E)
       · access[].renewals[]           — the renewal audit line (D)
       · deviceTransferRequests[]      — escalatedBy / escalatedAt /
                                         escalationNote (C)
     The back-fill is presence-guarded and idempotent, so it repairs a
     state written by any earlier build and never re-stamps a value a
     real person has since entered. */
  var SCHEMA_VERSION = 11;

  var STATUS = {
    DRAFT: 'DRAFT',
    SUBMITTED: 'SUBMITTED',
    /* STK31-20's second decision outcome. The request is NOT refused and
       NOT approved: it is returned to the applicant with a reason they
       can read, and it comes back to the queue when they resubmit. */
    INFO_REQUESTED: 'INFO_REQUESTED',
    APPROVED_PAYMENT_REQUIRED: 'APPROVED_PAYMENT_REQUIRED',
    ACTIVE: 'ACTIVE'
  };

  var STATUS_META = {
    DRAFT:                     { label: 'Draft',                       badge: 'b-neutral', icon: 'edit' },
    SUBMITTED:                 { label: 'Submitted',                   badge: 'b-info',    icon: 'clock' },
    INFO_REQUESTED:            { label: 'More information requested',  badge: 'b-warning', icon: 'clock' },
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
      attempts: [],
      /* Implementation 04 — the Faculty records. */
      questions: [],
      assessmentDefs: [],
      reviews: [],
      /* Implementation 05 — the content production records. */
      contentRecords: [],
      academicReviews: [],
      publicationRecords: [],
      contentActors: [],
      contentRoleAssignments: [],
      /* Implementation 06 — governance and operations. */
      contentVersions: [],
      tenantAdmins: [],
      deviceTransferRequests: [],
      supportTickets: [],
      /* Implementation 07.1 — the canonical ACADEMIC STRUCTURE, which
         stopped being a hardcoded array and became governed state. */
      groupings: [],
      courses: []
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
      questions: [],
      assessmentDefs: [],
      reviews: [],
      /* Implementation 05 — the canonical content pool and the
         production chain that owns it. */
      contentRecords: [],
      academicReviews: [],
      publicationRecords: [],
      contentActors: [],
      contentRoleAssignments: [],
      /* Implementation 06 — Super Admin governance and B2B operations.
         · contentVersions[]        — LATER versions of already-published
                                      Experiments. A separate object from
                                      the first-publication record, and
                                      the only thing Release / Hold acts
                                      on (STK31-07).
         · tenantAdmins[]           — who Super Admin assigned as the
                                      Tenant / Institute Admin (STK31-21)
         · deviceTransferRequests[] — Student → Institute / Tenant Admin
                                      → Super Admin device replacement /
                                      transfer (STK31-38, routed through
                                      the institution POC in 07.2)
         · supportTickets[]         — reported technical issues and their
                                      platform-side resolution (STK31-39) */
      contentVersions: [],
      tenantAdmins: [],
      deviceTransferRequests: [],
      supportTickets: [],
      /* Implementation 07.1 — the canonical academic structure.
         Seeded from data.GROUPINGS / data.COURSES so a fresh state is
         byte-for-byte the structure the prototype has always had, and
         then owned here: the Super Admin may add to it (D3 — create),
         and every catalogue lookup resolves against THIS, not the seed. */
      groupings: seedStructureRows(data.GROUPINGS),
      courses: seedStructureRows(data.COURSES),
      /* Which REAL assigned Tenant Admin the prototype is currently
         viewing as. Prototype-only; not authentication, and an admin of
         one tenant can never act for another. */
      protoTenantAdminId: null,
      /* Which REAL prototype content actor each of the three central
         workspaces is currently being viewed as. Prototype-only; not
         authentication, and choosing one grants nothing — scope still
         comes from contentRoleAssignments[]. */
      protoVendorId: null,
      protoReviewerId: null,
      protoManagerId: null,
      /* Faculty workflow preference, keyed by Faculty person id. NOT a
         role, NOT an evaluator: it only chooses whether the Faculty
         review screen offers the assistance affordance (STK31-31). */
      facultyPrefs: {},
      /* Which REAL faculty record the prototype is currently viewing
         as. Prototype-only; it is not authentication and grants
         nothing (Implementation 04). */
      protoFacultyId: null,
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
             resourceAct: 0, simAct: 0, attempt: 0,
             question: 0, assessmentDef: 0, review: 0,
             contentRec: 0, contentEvent: 0, actor: 0, roleAssign: 0, publication: 0,
             contentVersion: 0, tenantAdmin: 0, transfer: 0, ticket: 0 }
    };
    /* `contentSeeding` keeps the data.js published-pool resolver on the
       SEED array while this function builds a NEW state object: the
       resolver would otherwise read the OUTGOING state during a reset. */
    contentSeeding = true;
    structureSeeding = true;
    try {
      seedContent(S0);
      seedTenantOperations(S0);
      seedTenantGovernance(S0);
      seedFacultyAuthoring(S0);
    } finally {
      contentSeeding = false;
      structureSeeding = false;
      pubCache = null;
    }
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

  /* ============================================================
     IMPLEMENTATION 04 — FACULTY AUTHORING SEED.

     `data.ASSESSMENTS` was the STATIC sample assessment configuration
     Implementation 03 read directly. Faculty now own that configuration
     (STK31-30), so it can no longer live in a read-only file: it is
     evolved here into MUTABLE UNIFIED STATE.

       data.ASSESSMENTS  ──seed/migrate──▶  assessmentDefs[]  (mutable)
                         ──seed/migrate──▶  questions[]       (Question Bank)

     After this, `data.ASSESSMENTS` is a SEED SOURCE only. Nothing reads
     it at runtime: the Student engine and the Faculty workspace both
     read `assessmentDefs`, so there is exactly ONE assessment
     definition and the two roles cannot diverge.

     Every seeded value stays what Batch 02 and PM-08 called it —
     PROTOTYPE SAMPLE CONFIGURATION, never a platform constant.
     ============================================================ */

  /* One sample assessment → one Question Bank item per question + one
     assessment definition whose questions are COPIES carrying a link
     back to the bank item they came from. The copy is what makes
     "Delete from the Question Bank" and "Remove from this assessment"
     genuinely different actions (brief §17), and what stops a bank
     edit silently rewriting a live assessment (ND-15). */
  function seedAssessmentForTenant(S0, tenantId, sample) {
    var now = new Date().toISOString();
    var ctx = data.contextOf(sample.experimentId);
    var courseId = ctx && ctx.course ? ctx.course.id : '';
    var questions = sample.questions.map(function (q) {
      S0.seq.question += 1;
      var bank = {
        id: 'QB-' + util.pad3(S0.seq.question),
        tenantId: tenantId,
        courseId: courseId,
        experimentId: sample.experimentId,
        type: q.type,
        text: q.text,
        options: q.type === 'mcq' ? q.options.slice() : [],
        answer: q.type === 'descriptive' ? null : q.answer,
        points: q.points || 1,
        explanation: q.explanation || '',
        guidance: q.guidance || '',
        status: 'active',
        origin: 'seed',
        revision: 1,
        createdBy: null, createdAt: now, updatedAt: now, deletedAt: null
      };
      S0.questions.push(bank);
      return copyBankQuestion(bank);
    });

    S0.seq.assessmentDef += 1;
    var pol = sample.policy || { mode: 'SHOW_IMMEDIATELY' };
    var base = S0.seededAt || now;
    /* The sample policies were authored as day offsets from the seed
       instant so a fresh reset always behaves the same way. A Faculty
       control cannot edit an offset, so the offsets resolve HERE into
       the real dates Faculty now edit: an assessment deadline, and a
       custom release date. Nothing about the resulting behaviour
       changes. */
    var def = {
      id: 'ADEF-' + util.pad3(S0.seq.assessmentDef),
      tenantId: tenantId,
      experimentId: sample.experimentId,
      title: sample.title,
      intro: sample.intro,
      passMark: sample.passMark,
      attemptLimit: sample.attemptLimit,
      deadline: pol.mode === 'AFTER_DEADLINE' ? util.addDays(base, pol.offsetDays || 0) : null,
      policy: pol.mode === 'CUSTOM_DATE'
        ? { mode: 'CUSTOM_DATE', date: util.addDays(base, pol.offsetDays || 0) }
        : { mode: pol.mode },
      questions: questions,
      status: 'active',
      revision: 1,
      origin: 'seed',
      derivedFrom: sample.id,
      createdBy: null, updatedBy: null,
      createdAt: now, updatedAt: now, revisedAt: null
    };
    S0.assessmentDefs.push(def);
    return def;
  }

  /* A Question Bank item copied INTO an assessment. `bankRevision`
     records which revision of the bank item the copy was taken from,
     so the builder can say "this has been updated in the Question
     Bank" instead of silently drifting. */
  function copyBankQuestion(bank) {
    return {
      id: bank.id,                  /* stable within one assessment */
      bankQuestionId: bank.id,
      bankRevision: bank.revision,
      type: bank.type,
      text: bank.text,
      options: (bank.options || []).slice(),
      answer: bank.answer,
      points: bank.points || 1,
      explanation: bank.explanation || '',
      guidance: bank.guidance || ''
    };
  }

  function seedFacultyAuthoring(S0) {
    var tenantId = data.SEED_TENANT_ID;
    if (!S0.tenants.filter(function (t) { return t.id === tenantId; }).length) { return; }
    data.ASSESSMENTS.forEach(function (sample) {
      seedAssessmentForTenant(S0, tenantId, sample);
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
     'resourceAct', 'simAct', 'attempt', 'question', 'assessmentDef', 'review',
     'contentRec', 'contentEvent', 'actor', 'roleAssign', 'publication',
     'contentVersion', 'tenantAdmin', 'transfer', 'ticket']
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
    /* Memberships gained an ordering stamp when the allocation queue
       stopped falling back to comparing ids. Array order IS the creation
       order, so backfilling in place preserves exactly the sequence in
       which students actually joined their groups. */
    parsed.memberships.forEach(function (m) {
      if (typeof m.eventSeq !== 'number') { parsed.seq.event += 1; m.eventSeq = parsed.seq.event; }
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
    if (typeof parsed.protoFacultyId !== 'string') { parsed.protoFacultyId = null; }
    else if (!parsed.people.some(function (p) { return p.id === parsed.protoFacultyId && p.role === 'faculty'; })) {
      parsed.protoFacultyId = null;
    }
    if (!parsed.facultyPrefs || typeof parsed.facultyPrefs !== 'object') { parsed.facultyPrefs = {}; }

    migrateFacultyAuthoring(parsed, stored);
    /* Structure first, so `parsed.groupings` / `parsed.courses` are whole
       before anything else reads them.

       ⚠ NOT because the lookups resolve here — THEY DO NOT. `S` is not
       assigned until after `migrate()` returns, so `structureSource()`
       answers null throughout migration and `data.course()` falls back to
       the SEED array. A migration step that needs the migrating state's
       structure must read `parsed.courses` directly; `data.course()`
       would silently miss every platform-created Course. */
    migrateCatalogueStructure(parsed);
    migrateContentProduction(parsed, stored);
    migrateGovernance(parsed, stored);
    migrateTransferScope(parsed);
    /* Implementation 07.2. Runs AFTER the structure back-fill, so every
       Course row — seeded or platform-created — is present and can be
       given its canonical-code field. */
    migrateStakeholderCorrections(parsed);

    parsed.schemaVersion = SCHEMA_VERSION;
    delete parsed.version;
    parsed.migratedFrom = stored < SCHEMA_VERSION ? stored : (parsed.migratedFrom || null);
    return parsed;
  }

  /* SCHEMA 8 → 9: the canonical academic structure becomes state.

     PURELY ADDITIVE. A state written by any earlier build has no
     `groupings[]` / `courses[]` at all; it is given the seeded structure,
     which is exactly the structure that build was reading out of
     data.js — so every stored courseId, course mapping, faculty mapping,
     access record and assignment resolves to the same row it always did.

     The back-fill is by ID and runs on EVERY load, not only the first:
     a Programme or Course added to the seed by a later build joins an
     existing state instead of being invisible in it, and a row created
     on the platform is never touched, re-seeded or reordered. Nothing
     here deletes or renames anything. */
  function migrateCatalogueStructure(parsed) {
    if (!Array.isArray(parsed.groupings)) { parsed.groupings = []; }
    if (!Array.isArray(parsed.courses)) { parsed.courses = []; }

    function backfill(target, seedRows) {
      var have = {};
      target.forEach(function (r) { if (r && r.id) { have[r.id] = true; } });
      seedStructureRows(seedRows).forEach(function (r) {
        if (!have[r.id]) { target.push(r); }
      });
    }
    backfill(parsed.groupings, data.GROUPINGS);
    backfill(parsed.courses, data.COURSES);

    /* Provenance back-fill for a row written before the field existed.
       Anything already in the collection that the seed does not name was
       created on the platform, so it is recorded as such rather than
       being silently relabelled a seed row. */
    var seededG = {}; data.GROUPINGS.forEach(function (g) { seededG[g.id] = true; });
    var seededC = {}; data.COURSES.forEach(function (c) { seededC[c.id] = true; });
    parsed.groupings.forEach(function (g) {
      if (typeof g.source !== 'string') { g.source = seededG[g.id] ? 'seed' : 'manual'; }
    });
    parsed.courses.forEach(function (c) {
      if (typeof c.source !== 'string') { c.source = seededC[c.id] ? 'seed' : 'manual'; }
    });
    /* THE ONE PLACE THIS FUNCTION MUTATES RATHER THAN ADDS, and it is a
       repair, not an edit: a Course whose Programme is absent would
       vanish from the tree and from the public catalogue while still
       holding published content. It is re-parented to the first grouping
       so it stays reachable. No row is ever discarded. This is not
       reachable from the product today — nothing deletes a Programme —
       and it exists for a hand-edited or branch-written state. */
    var gids = {}; parsed.groupings.forEach(function (g) { gids[g.id] = true; });
    parsed.courses.forEach(function (c) {
      if (!gids[c.groupingId] && parsed.groupings.length) { c.groupingId = parsed.groupings[0].id; }
    });
  }

  /* SCHEMA 9 → 10: the three fields Implementation 07.2 adds.

     PRESENCE-GUARDED, ID-KEYED, IDEMPOTENT, and it runs on EVERY load
     rather than once at a version boundary — the same shape as
     `migrateCatalogueStructure` above and for the same reason: a state
     that has already been stamped 10 must still be repairable, and a
     value a real person has entered must never be re-stamped back to
     the seed. Nothing here deletes, renames or reorders a row.

     ⚠ It reads `parsed.courses` DIRECTLY, never `data.course()`: `S` is
     unassigned during migration, so the structure resolver answers null
     and the lookup would silently miss every platform-created Course. */
  function migrateStakeholderCorrections(parsed) {
    /* E — the canonical Course Code. Seeded rows take the seed's value
       (blank today: no official code has been supplied, and blank is a
       legitimate state); a platform-created row starts blank. A code
       that already exists is never touched. */
    var seededCode = {};
    data.COURSES.forEach(function (c) { seededCode[c.id] = typeof c.code === 'string' ? c.code : ''; });
    parsed.courses.forEach(function (c) {
      if (typeof c.code !== 'string') { c.code = seededCode[c.id] || ''; }
    });

    /* ── SCHEMA 10 → 11, Implementation 07.3 ──────────────────────
       Three additive fields, PRESENCE-GUARDED and IDEMPOTENT exactly as
       the 07.2 back-fill above: a preview video reference on a content
       record, a supporting-reference list on a history entry, and the
       reviewer-recheck status is a NEW VALUE of an existing field, so no
       stored record needs rewriting for it. Nothing is deleted, renamed
       or reordered, and a value a real person entered is never
       re-stamped. */
    if (Array.isArray(parsed.contentRecords)) {
      parsed.contentRecords.forEach(function (r) {
        if (!r) { return; }
        /* Absent means "no preview video was ever supplied", and null is
           what every reader already treats as that. Never invented. */
        if (typeof r.previewVideo === 'undefined') { r.previewVideo = null; }
        if (Array.isArray(r.history)) {
          r.history.forEach(function (h) {
            /* Empty, not missing — a change request written before
               references existed genuinely carried none. */
            if (h && !Array.isArray(h.refs)) { h.refs = []; }
          });
        }
      });
    }
    if (Array.isArray(parsed.academicReviews)) {
      parsed.academicReviews.forEach(function (r) {
        if (r && !Array.isArray(r.refs)) { r.refs = []; }
      });
    }
    /* The durable withdraw/restore audit line on a role assignment.

       ⚠ IT LIVES HERE, NOT IN `migrateGovernance`. That function opens
       with `if (storedVersion >= 7) { return; }`, so a state at 7 or
       later never reaches it — a schema-10 state would have been left
       without the array every reader now assumes. Empty is the true
       value: a row withdrawn by an earlier build genuinely has no
       recorded event, and its `removed*` fields still carry the current
       suspension, so nothing is lost and nothing is invented. */
    if (Array.isArray(parsed.contentRoleAssignments)) {
      parsed.contentRoleAssignments.forEach(function (m) {
        if (!m) { return; }
        if (!Array.isArray(m.history)) { m.history = []; }
        /* ⚠ A ROW THAT IS WITHDRAWN RIGHT NOW ALREADY HOLDS ITS OWN
           EVIDENCE — 07.3 adversarial fix. Back-filling an EMPTY array
           onto it lost exactly the case the audit line exists for: the
           row read `status:'removed'` with a reason on it, yet
           `actorWasEverSuspended()` answered false, no badge or alert
           rendered, and restoring it then cleared the `removed*` fields
           and left nothing at all. Synthesising the entry INVENTS
           NOTHING — every value below is already on the row. */
        if (m.status === 'removed' && !m.history.length) {
          m.history.push({
            kind: 'withdrawn', label: 'Scope withdrawn',
            note: m.removedReason || '',
            by: m.removedBy || 'Super Admin',
            at: m.removedAt || null,
            /* Marked, so a reader can tell a reconstructed entry from one
               that was recorded as it happened. */
            backfilled: true
          });
        }
      });
    }

    /* D — the renewal audit line on an access record. An access record
       written by an earlier build has renewed nothing, so an empty array
       is the true value, and "empty, not missing" is what every reader
       expects. The access TERM itself is never touched here. */
    if (Array.isArray(parsed.access)) {
      parsed.access.forEach(function (a) {
        if (!Array.isArray(a.renewals)) { a.renewals = []; }
      });
    }

    /* C — the Tenant Admin hop on a device request.

       A stored request sitting at `submitted` is NOT rewritten. Under
       the corrected routing `submitted` MEANS "with the Institute /
       Tenant Admin", which is exactly where an undecided request should
       be, so the honest migration is to leave the status alone and add
       the three fields the escalation writes. A request already
       approved or declined keeps its decision untouched. */
    if (Array.isArray(parsed.deviceTransferRequests)) {
      parsed.deviceTransferRequests.forEach(function (r) {
        if (r.escalatedBy === undefined) { r.escalatedBy = null; }
        if (r.escalatedAt === undefined) { r.escalatedAt = null; }
        if (typeof r.escalationNote !== 'string') { r.escalationNote = ''; }
      });
    }
  }

  /* SCHEMA 4 → 5: assessment configuration becomes Faculty-owned
     mutable state, and every submitted attempt gains the snapshot that
     keeps it historically interpretable.

     Nothing is discarded. Every request, tenant, access record, person,
     group, mapping, assignment, resource record, simulation record and
     assessment attempt written by an earlier build survives untouched;
     this only ADDS the Implementation-04 records around them. */
  function migrateFacultyAuthoring(parsed, storedVersion) {
    if (storedVersion >= 5) { return; }
    var seededAt = parsed.seededAt || new Date().toISOString();
    var shim = { seq: parsed.seq, questions: parsed.questions,
                 assessmentDefs: parsed.assessmentDefs, tenants: parsed.tenants,
                 seededAt: seededAt };

    function defFor(tenantId, experimentId) {
      return parsed.assessmentDefs.filter(function (d) {
        return d.tenantId === tenantId && d.experimentId === experimentId && d.status === 'active';
      })[0] || null;
    }
    function materialise(tenantId, sample) {
      var existing = defFor(tenantId, sample.experimentId);
      if (existing) { return existing; }
      return seedAssessmentForTenant(shim, tenantId, sample);
    }

    /* 1 · The seeded tenant receives the sample configuration it always
           had — now as editable state rather than a read-only file. */
    if (parsed.tenants.some(function (t) { return t.id === data.SEED_TENANT_ID; })) {
      data.ASSESSMENTS.forEach(function (sample) { materialise(data.SEED_TENANT_ID, sample); });
    }
    /* 2 · Any OTHER tenant whose students already attempted a sample
           assessment keeps a live definition for it, so an existing
           attempt never lands on "no assessment is set". */
    parsed.attempts.forEach(function (a) {
      var sample = data.ASSESSMENTS.filter(function (x) { return x.id === a.assessmentId; })[0];
      if (sample && a.tenantId) { materialise(a.tenantId, sample); }
    });

    /* 3 · Attempt snapshots. An attempt written before Faculty could
           edit anything was taken against the sample configuration, so
           snapshotting it from that sample is the honest record of what
           the Student actually answered. */
    parsed.attempts.forEach(function (a) {
      if (a.snapshot) { return; }
      var src = data.ASSESSMENTS.filter(function (x) { return x.id === a.assessmentId; })[0];
      if (!src) {
        var d = defFor(a.tenantId, a.experimentId);
        if (d) { a.snapshot = snapshotOfDefinition(d); }
        return;
      }
      a.snapshot = {
        assessmentId: a.assessmentId,
        revision: 1,
        title: src.title,
        intro: src.intro,
        passMark: src.passMark,
        attemptLimit: src.attemptLimit,
        questions: src.questions.map(function (q) {
          return {
            id: q.id, bankQuestionId: null, type: q.type, text: q.text,
            options: q.type === 'mcq' ? q.options.slice() : [],
            answer: q.type === 'descriptive' ? null : q.answer,
            points: q.points || 1,
            explanation: q.explanation || '', guidance: q.guidance || ''
          };
        })
      };
      /* Re-point the attempt at the tenant's live definition where one
         now exists, so attempt history and current configuration share
         an identity. The SNAPSHOT above, not the definition, is what
         the result screen renders. */
      var live = defFor(a.tenantId, a.experimentId);
      if (live) { a.assessmentId = live.id; a.snapshot.assessmentId = live.id; }
    });

    /* 4 · A submitted attempt containing a written answer already told
           the Student "Pending Faculty review". That promise now has a
           queue behind it: the review obligation is created here for
           every such attempt, exactly as submission would create it. */
    parsed.attempts.forEach(function (a) {
      if (a.status !== 'submitted' || !a.snapshot) { return; }
      a.snapshot.questions.forEach(function (q) {
        if (q.type !== 'descriptive') { return; }
        var exists = parsed.reviews.some(function (r) {
          return r.attemptId === a.id && r.questionId === q.id;
        });
        if (exists) { return; }
        parsed.seq.review += 1;
        parsed.reviews.push({
          id: 'REV-' + util.pad3(parsed.seq.review),
          tenantId: a.tenantId, attemptId: a.id, questionId: q.id,
          personId: a.personId, experimentId: a.experimentId,
          maxMarks: q.points || 1,
          status: 'pending', marks: null, feedback: '',
          reviewedBy: null, reviewedAt: null,
          assistance: null,
          createdAt: a.submittedAt || new Date().toISOString()
        });
      });
    });
  }


  /* ============================================================
     IMPLEMENTATION 05 — CONTENT PRODUCTION AND FIRST PUBLICATION

     Vendor  →  Academic Reviewer  →  Content Manager  →  Published

     ── THE TERMINOLOGY FIREWALL (STK31-06 / STK31-07) ───────────
     FIRST PUBLICATION of a NEW Experiment  → Content Manager → the
       word is PUBLISH. That is what this slice builds.
     LATER VERSION of an ALREADY-PUBLISHED Experiment → Super Admin →
       the words are RELEASE / HOLD. That is a DIFFERENT action on a
       DIFFERENT object and is NOT built here. Neither word appears on
       any first-publication surface.

     ── AUTHORITY (STK31-08) ─────────────────────────────────────
     Vendor            technical submission. CAN NEVER PUBLISH
                       (FRD 1.4.5 — the only explicit role
                       prohibition, and it covers internal BITS
                       submitters too, STK31-03). Does NOT own
                       Learning Outcomes.
     Academic Reviewer academic validation + LEARNING OUTCOMES.
                       Cannot publish.
     Content Manager   Content Library + FIRST PUBLICATION + canonical
                       content metadata. Cannot publish an item that
                       carries no academic approval.

     ── PUBLISHED ≠ TENANT ACCESS ≠ STUDENT ENTITLEMENT ──────────
     Publishing writes ONE thing: the content record's status. It
     creates no access[] row, touches no licence, creates no
     assignment. The Implementation-01 request → approval → activation
     lifecycle and the Implementation-02 assignment remain the only
     ways content reaches a tenant and then a student.
     ============================================================ */

  /* The status set is Batch 01's shipped model (`U-VND-04` — KEEP +
     REWORD), re-worded to the unified build's sentence case and to
     PM-14's own verb ("request changes"). Batch 01's transient
     `publishing` state is NOT carried: it animated a deployment this
     prototype does not perform, and claiming one would be false.
     Batch 01's own note records why there is no "ready to publish"
     hand-off state — the Content Manager publishes AT the readiness
     gate, so `CONTENT_REVIEW` is both "academically approved" and
     "awaiting first publication". */
  var CONTENT_STATUS = {
    DRAFT:            'DRAFT',
    ACADEMIC_REVIEW:  'ACADEMIC_REVIEW',
    CHANGES_ACADEMIC: 'CHANGES_ACADEMIC',
    CONTENT_REVIEW:   'CONTENT_REVIEW',
    CHANGES_CONTENT:  'CHANGES_CONTENT',
    /* Implementation 07.3 — the Content Manager's ACADEMIC return.
       The stakeholder split the Content Manager's single ambiguous
       "request changes" into two destinations: an academic/content
       issue goes back to the ACADEMIC REVIEWER, a technical/delivery
       issue goes back to the VENDOR (which is `CHANGES_CONTENT`).
       This status is the first of those, and its holder is therefore
       the reviewer — not the vendor. */
    CHANGES_ACADEMIC_RECHECK: 'CHANGES_ACADEMIC_RECHECK',
    PUBLISHED:        'PUBLISHED'
  };

  /* `holder` is who the item is WITH — the question every one of the
     three workspaces asks first. Status is never carried by colour
     alone: every badge has a text label and an icon. */
  var CONTENT_STATUS_META = {
    DRAFT:            { label: 'Draft',                     badge: 'b-neutral', icon: 'edit',   holder: 'vendor' },
    ACADEMIC_REVIEW:  { label: 'Academic review',           badge: 'b-info',    icon: 'clock',  holder: 'reviewer' },
    CHANGES_ACADEMIC: { label: 'Changes requested',         badge: 'b-warning', icon: 'alert',  holder: 'vendor' },
    CONTENT_REVIEW:   { label: 'Content readiness review',  badge: 'b-info',    icon: 'layers', holder: 'manager' },
    CHANGES_CONTENT:  { label: 'Changes requested',         badge: 'b-warning', icon: 'alert',  holder: 'vendor' },
    CHANGES_ACADEMIC_RECHECK:
                      { label: 'Returned for academic re-check', badge: 'b-warning', icon: 'alert', holder: 'reviewer' },
    PUBLISHED:        { label: 'Published',                 badge: 'b-success', icon: 'check',  holder: null }
  };

  var CONTENT_ROLE = { VENDOR: 'vendor', REVIEWER: 'reviewer', MANAGER: 'manager' };
  var CONTENT_ROLE_LABEL = {
    vendor: 'Vendor', reviewer: 'Academic Reviewer', manager: 'Content Manager'
  };

  /* A record the Vendor may still edit is one the workflow has handed
     back to them. While an Academic Reviewer or the Content Manager
     holds the submitted revision it is read-only for the Vendor, so
     the revision under review cannot change underneath the reviewer.
     A PUBLISHED record is read-only for the whole first-publication
     workflow (a later version is Super Admin Release/Hold — not here). */
  var VENDOR_EDITABLE = [CONTENT_STATUS.DRAFT, CONTENT_STATUS.CHANGES_ACADEMIC, CONTENT_STATUS.CHANGES_CONTENT];

  /* ---------- prototype content actors and their scope ----------
     STK31-41: Super Admin governs Vendor · Academic Reviewer · Content
     Manager, and assignment may be Course- or Experiment-specific,
     with several people permitted on one Experiment. That governance
     UI is Implementation 06 (`U-SA-15`), so the assignments below are
     PROTOTYPE SEED DATA standing in for it — read by the scope checks,
     writable by nothing in this slice. Identities are the neutral
     sample names the Batch 01 governance prototype already used; none
     is a real person. */
  var SEED_CONTENT_ACTORS = [
    { key: 'v-rao',    role: 'vendor',   name: 'Ananya Rao',        organisation: 'Sample XR Content Vendor',
      email: 'ananya.rao@sample-vendor.example' },
    { key: 'v-menon',  role: 'vendor',   name: 'K. Menon',          organisation: 'Sample Labs Collective',
      email: 'k.menon@sample-labs.example' },
    { key: 'r-iyer',   role: 'reviewer', name: 'Dr. R. Iyer',       organisation: 'Academic review panel (sample)',
      email: 'r.iyer@sample-academic.example' },
    { key: 'r-nanda',  role: 'reviewer', name: 'Dr. S. Nandakumar', organisation: 'Academic review panel (sample)',
      email: 's.nandakumar@sample-academic.example' },
    { key: 'cm-kulk',  role: 'manager',  name: 'M. Kulkarni',       organisation: 'Platform content team (sample)',
      email: 'm.kulkarni@sample-platform.example' }
  ];

  /* scope 'course' → the actor works on that canonical Course.
     scope 'all'    → platform-wide. The Content Library is a
                      platform-level surface (STK31-06), so the sample
                      Content Manager holds the platform scope. */
  var SEED_CONTENT_ASSIGNMENTS = [
    { actorKey: 'v-rao',   role: 'vendor',   scope: 'course', courseId: 'soil-mechanics' },
    { actorKey: 'v-rao',   role: 'vendor',   scope: 'course', courseId: 'surveying' },
    { actorKey: 'v-rao',   role: 'vendor',   scope: 'course', courseId: 'structural-analysis' },
    { actorKey: 'v-menon', role: 'vendor',   scope: 'course', courseId: 'strength-of-materials' },
    { actorKey: 'v-menon', role: 'vendor',   scope: 'course', courseId: 'fluid-mechanics' },
    { actorKey: 'r-iyer',  role: 'reviewer', scope: 'course', courseId: 'soil-mechanics' },
    { actorKey: 'r-iyer',  role: 'reviewer', scope: 'course', courseId: 'surveying' },
    { actorKey: 'r-iyer',  role: 'reviewer', scope: 'course', courseId: 'structural-analysis' },
    { actorKey: 'r-nanda', role: 'reviewer', scope: 'course', courseId: 'strength-of-materials' },
    { actorKey: 'r-nanda', role: 'reviewer', scope: 'course', courseId: 'fluid-mechanics' },
    { actorKey: 'cm-kulk', role: 'manager',  scope: 'all',    courseId: null }
  ];

  /* ---------- content seed ---------- */

  function blankDelivery() { return {}; }

  /* A preview video reference. URL ONLY — the prototype stores what the
     Vendor typed and nothing else. No bytes are read or transmitted, and
     every surface that renders one says so rather than implying a hosted
     upload. Returns null for an empty value, which is a legal state:
     an Experiment without a preview video simply has none. */
  function normalizePreviewVideo(input, actorId, previous) {
    if (input === undefined) { return previous || null; }
    if (!input) { return null; }
    var url = String(input.url || '').trim();
    if (!url || !isHttpUrl(url)) { return null; }
    var prevUrl = previous && previous.url;
    return {
      url: url,
      label: String(input.label || '').trim(),
      note: String(input.note || '').trim(),
      addedBy: actorId || (previous && previous.addedBy) || null,
      /* The moment it CHANGED, so a reviewer can see it is new. */
      addedAt: (prevUrl === url && previous && previous.addedAt)
        ? previous.addedAt : new Date().toISOString()
    };
  }

  function newContentRecord(fields) {
    return {
      id: fields.id,
      courseId: fields.courseId || '',
      name: fields.name || '',
      summary: fields.summary || '',
      description: fields.description || '',
      /* Academically owned (STK31-08). A Vendor never writes this. */
      outcomes: fields.outcomes ? fields.outcomes.slice() : [],
      technologies: fields.technologies ? fields.technologies.slice() : [],
      /* Per-technology delivery detail. AR/VR/MR carry package or
         reference metadata; Web/WebGL carries a hosted link
         (STK31-37). Nothing here is a real upload — see `packageFile`. */
      delivery: fields.delivery || blankDelivery(),
      documents: fields.documents ? fields.documents.slice() : [],
      /* PREVIEW / DEMO VIDEO (07.3). The stakeholder asked the Vendor to
         supply the preview video that the public experiment page shows:
         *"give them a provision to add the video also"*. It travels the
         whole workflow — Vendor, Academic Reviewer, Content Manager — and
         reaches the public catalogue ONLY once the record is PUBLISHED.
         Null until the Vendor supplies one; a URL reference, never an
         upload — this prototype has no server to upload to. */
      /* NORMALISED, never raw. A caller handing this a bare object would
         otherwise store an unvalidated URL with no `addedBy`/`addedAt`,
         and `previewVideoHTML` would render a link the write path would
         have refused. `normalizePreviewVideo` returns null for anything
         that is not an http(s) URL. */
      previewVideo: normalizePreviewVideo(fields.previewVideo, fields.createdBy || null, null),
      vendorNotes: fields.vendorNotes || '',
      versionLabel: fields.versionLabel || '',
      /* Batch 01's integer version: it counts CORRECTION ROUNDS on this
         submission. It is NOT the Super-Admin ContentVersion of
         STK31-07 — those are two different objects and this slice
         builds only the first. */
      revision: fields.revision || 1,
      status: fields.status || CONTENT_STATUS.DRAFT,
      origin: fields.origin || 'vendor',
      createdBy: fields.createdBy || null,
      createdAt: fields.createdAt || new Date().toISOString(),
      updatedAt: fields.updatedAt || fields.createdAt || new Date().toISOString(),
      submittedBy: fields.submittedBy || null,
      submittedAt: fields.submittedAt || null,
      returnedGate: fields.returnedGate || null,
      resubmitted: !!fields.resubmitted,
      academicReview: fields.academicReview || null,
      publication: fields.publication || null,
      history: fields.history || [],
      eventSeq: fields.eventSeq || 0
    };
  }

  /* Existing published catalogue content migrates as PUBLISHED content
     with a publication record whose origin is `seed`. It is deliberately
     NOT pushed through a fabricated Vendor → Reviewer → Manager history:
     inventing one would put words in people's mouths. The origin is
     implementation metadata; the user-facing line simply says the
     content existed in the published catalogue before this workflow. */
  function seedContentPool(S0) {
    var stamp = S0.seededAt || new Date().toISOString();
    data.EXPERIMENTS.forEach(function (e) {
      S0.seq.contentRec += 1;
      S0.seq.contentEvent += 1;
      S0.seq.publication += 1;
      var pubId = 'PUB-' + util.pad3(S0.seq.publication);
      var rec = newContentRecord({
        id: e.id,
        courseId: e.courseId,
        name: e.name,
        summary: e.summary,
        description: e.description,
        outcomes: e.outcomes,
        technologies: e.technologies,
        delivery: seedDeliveryFor(e.technologies),
        documents: [],
        versionLabel: '1.0',
        revision: 1,
        status: CONTENT_STATUS.PUBLISHED,
        origin: 'seed',
        createdAt: stamp,
        updatedAt: stamp
      });
      rec.eventSeq = S0.seq.contentEvent;
      rec.publication = {
        id: pubId,
        recordId: rec.id,
        publishedBy: null,
        publishedByName: 'Existing published content (prototype seed)',
        publishedAt: stamp,
        versionLabel: '1.0',
        revision: 1,
        technologies: e.technologies.slice(),
        outcomes: e.outcomes.slice(),
        origin: 'seed'
      };
      rec.history = [{
        seq: S0.seq.contentEvent, kind: 'seeded',
        label: 'Existing published catalogue content',
        actorName: null, actorRole: null, at: stamp,
        note: 'Present in the published catalogue before the content production workflow was integrated.'
      }];
      S0.contentRecords.push(rec);
      S0.publicationRecords.push(JSON.parse(JSON.stringify(rec.publication)));
    });
  }

  /* Delivery detail for seeded published content: enough to describe
     what each published technology is, without asserting a package that
     was never produced. */
  function seedDeliveryFor(techs) {
    var out = {};
    techs.forEach(function (t) {
      var def = data.TECHNOLOGIES[t];
      if (!def) { return; }
      if (def.delivery === 'hosted') {
        out[t] = { url: 'https://xr.example.edu/hosted/' + t, runtime: def.requirement, notes: '',
                   packageLabel: '', packageRef: '', packageFile: null, install: '' };
      } else {
        out[t] = { url: '', runtime: def.requirement, notes: '',
                   packageLabel: 'Existing published ' + def.label + ' package',
                   packageRef: 'SEED-' + t.toUpperCase() + '-1.0', packageFile: null, install: '' };
      }
    });
    return out;
  }

  /* A small in-flight pipeline so the three workspaces open on real
     records rather than on nothing, and so the correction loop is
     visible without first having to drive it. Every one of these is
     UNPUBLISHED and must therefore be unreachable from the public
     catalogue, tenant access, Faculty and Student. */
  function seedContentPipeline(S0) {
    var base = S0.seededAt || new Date().toISOString();
    function ago(days) { return util.addDays(base, -days); }
    function actorId(key) {
      var a = S0.contentActors.filter(function (x) { return x.key === key; })[0];
      return a ? a.id : null;
    }
    function actorName(key) {
      var a = S0.contentActors.filter(function (x) { return x.key === key; })[0];
      return a ? a.name : '';
    }
    function ev(rec, kind, label, key, role, at, note) {
      S0.seq.contentEvent += 1;
      rec.history.unshift({ seq: S0.seq.contentEvent, kind: kind, label: label,
        actorName: key ? actorName(key) : null,
        /* The same display label the runtime writer uses, so one timeline
           never renders "vendor" beside "Vendor". */
        actorRole: role ? (CONTENT_ROLE_LABEL[role] || role) : null,
        at: at, note: note || '' });
      rec.eventSeq = S0.seq.contentEvent;
    }

    var PIPELINE = [
      {
        courseId: 'soil-mechanics', vendor: 'v-rao', status: CONTENT_STATUS.DRAFT,
        name: 'Permeability Test (sample draft)',
        summary: 'Determine the coefficient of permeability of a soil sample using constant-head and falling-head arrangements.',
        description: 'The learner sets up a permeameter, establishes steady flow and records head and discharge readings for both the constant-head and the falling-head arrangement, then computes the coefficient of permeability.',
        technologies: ['vr', 'web'], versionLabel: '1.0',
        vendorNotes: 'Sample draft submission. Falling-head arrangement is still being tuned.'
      },
      {
        courseId: 'surveying', vendor: 'v-rao', status: CONTENT_STATUS.ACADEMIC_REVIEW,
        name: 'Differential Levelling Exercise (sample)',
        summary: 'Run a closed levelling circuit with an automatic level and reduce the readings by the rise-and-fall method.',
        description: 'The learner sets up an automatic level, takes backsight, intermediate and foresight readings around a closed circuit, books them in a level field book and reduces the readings, closing the circuit within an acceptable misclosure.',
        technologies: ['ar', 'web'], versionLabel: '1.0', submitDaysAgo: 3,
        vendorNotes: 'AR target sheets are supplied with the package.'
      },
      {
        courseId: 'structural-analysis', vendor: 'v-rao', status: CONTENT_STATUS.CONTENT_REVIEW,
        name: 'Column Buckling Test (sample)',
        summary: 'Observe the critical buckling load of slender columns under different end conditions.',
        description: 'The learner mounts slender columns with pinned and fixed end conditions in a simulated loading frame, increases axial load until buckling is observed and compares the critical load with the Euler prediction for each end condition.',
        technologies: ['vr', 'web'], versionLabel: '1.0', submitDaysAgo: 6, approveDaysAgo: 2,
        reviewer: 'r-iyer',
        outcomes: [
          'Set up slender columns with pinned and fixed end conditions in a loading frame.',
          'Identify the critical buckling load observed for each end condition.',
          'Compare observed critical loads with Euler predictions and account for the difference.'
        ],
        reviewComment: 'Course alignment confirmed for the structural stability unit. Outcomes recorded.',
        vendorNotes: 'Both end-condition rigs are included in the same package.'
      },
      {
        courseId: 'fluid-mechanics', vendor: 'v-menon', status: CONTENT_STATUS.CHANGES_ACADEMIC,
        name: 'Venturi Meter Experiment (sample)',
        summary: 'Measure discharge through a venturi meter and determine its coefficient of discharge.',
        description: 'The learner establishes flow through a venturi meter, reads the differential manometer at several flow rates and determines the coefficient of discharge from the measured and theoretical discharges.',
        technologies: ['vr'], versionLabel: '1.0', submitDaysAgo: 8, changesDaysAgo: 5,
        reviewer: 'r-nanda',
        reviewComment: 'The sample manometer readings do not reconcile with the stated throat diameter, so the coefficient of discharge cannot be derived from them. Please correct the sample data set and resubmit.'
      }
    ];

    PIPELINE.forEach(function (p) {
      S0.seq.contentRec += 1;
      var rec = newContentRecord({
        id: 'EXP-' + util.pad3(S0.seq.contentRec),
        courseId: p.courseId, name: p.name, summary: p.summary, description: p.description,
        outcomes: p.outcomes || [], technologies: p.technologies,
        delivery: seedDeliveryFor(p.technologies),
        documents: [{ name: 'Instructor guide — ' + p.name + '.pdf', size: '1.8 MB', note: '' }],
        vendorNotes: p.vendorNotes || '', versionLabel: p.versionLabel,
        status: p.status, origin: 'vendor',
        createdBy: actorId(p.vendor),
        createdAt: ago((p.submitDaysAgo || 1) + 2),
        updatedAt: ago(p.changesDaysAgo || p.approveDaysAgo || p.submitDaysAgo || 1)
      });
      ev(rec, 'created', 'Draft created', p.vendor, 'vendor', rec.createdAt, '');
      if (p.status !== CONTENT_STATUS.DRAFT) {
        rec.submittedBy = actorId(p.vendor);
        rec.submittedAt = ago(p.submitDaysAgo);
        ev(rec, 'submitted', 'Submitted for academic review (v' + rec.revision + ')',
           p.vendor, 'vendor', rec.submittedAt, '');
      }
      if (p.status === CONTENT_STATUS.CONTENT_REVIEW) {
        S0.seq.review += 1;
        var review = {
          id: 'ACR-' + util.pad3(S0.seq.review), recordId: rec.id,
          reviewerId: actorId(p.reviewer), reviewerName: actorName(p.reviewer),
          decision: 'approved', comment: p.reviewComment || '',
          revision: rec.revision, outcomes: (p.outcomes || []).slice(),
          at: ago(p.approveDaysAgo),
          /* Same fingerprint the runtime approval records, so a seeded
             approval is held to exactly the same rule. */
          fingerprint: academicFingerprint(rec)
        };
        S0.academicReviews.push(review);
        rec.academicReview = JSON.parse(JSON.stringify(review));
        ev(rec, 'approved', 'Academic validation complete', p.reviewer, 'reviewer', review.at, p.reviewComment || '');
      }
      if (p.status === CONTENT_STATUS.CHANGES_ACADEMIC) {
        S0.seq.review += 1;
        var ret = {
          id: 'ACR-' + util.pad3(S0.seq.review), recordId: rec.id,
          reviewerId: actorId(p.reviewer), reviewerName: actorName(p.reviewer),
          decision: 'changes_requested', comment: p.reviewComment || '',
          revision: rec.revision, outcomes: (p.outcomes || []).slice(),
          at: ago(p.changesDaysAgo)
        };
        S0.academicReviews.push(ret);
        rec.returnedGate = 'academic';
        ev(rec, 'changes', 'Changes requested — academic review', p.reviewer, 'reviewer', ret.at, p.reviewComment || '');
      }
      S0.contentRecords.push(rec);
    });
  }

  function seedContentActors(S0) {
    SEED_CONTENT_ACTORS.forEach(function (a) {
      S0.seq.actor += 1;
      S0.contentActors.push({
        id: 'ACT-' + util.pad3(S0.seq.actor), key: a.key, role: a.role,
        name: a.name, organisation: a.organisation, email: a.email, source: 'seed'
      });
    });
    SEED_CONTENT_ASSIGNMENTS.forEach(function (m) {
      var actor = S0.contentActors.filter(function (x) { return x.key === m.actorKey; })[0];
      if (!actor) { return; }
      S0.seq.roleAssign += 1;
      S0.contentRoleAssignments.push({
        id: 'CRA-' + util.pad3(S0.seq.roleAssign), actorId: actor.id, role: m.role,
        scope: m.scope, courseId: m.courseId || null, experimentId: m.experimentId || null,
        source: 'seed',
        /* Implementation 06 — the row became governed state. `status`
           makes removal REVERSIBLE (STK31-22): a withdrawn scope is
           recorded, never deleted, so the decisions taken under it stay
           explicable. */
        status: 'active',
        assignedBy: 'Prototype seed',
        assignedAt: null,
        removedBy: null, removedAt: null, removedReason: '',
        /* 07.3 — see `roleAssignmentHistory`. */
        history: []
      });
    });
  }

  /* Implementation 06 — the assigned Tenant / Institute Admin.
     STK31-21 gives the Super Admin the assignment; QD-02 still does not
     say how an identity first comes to exist, so nothing here invents an
     invitation or an account-creation mechanism. The seeded tenant gets
     one sample Tenant Admin so the Implementation-02 workspace is
     reachable exactly as before. */
  function seedTenantGovernance(S0) {
    var t = S0.tenants.filter(function (x) { return x.id === data.SEED_TENANT_ID; })[0];
    if (!t) { return; }
    S0.seq.tenantAdmin += 1;
    S0.tenantAdmins.push({
      id: 'TAD-' + util.pad3(S0.seq.tenantAdmin),
      tenantId: t.id,
      name: 'Priya Raghavan',
      email: 'priya.raghavan@sample-institute.example',
      status: 'active',
      source: 'seed',
      assignedBy: 'Prototype seed',
      assignedAt: S0.seededAt || null,
      removedBy: null, removedAt: null
    });
  }

  function seedContent(S0) {
    seedContentActors(S0);
    seedContentPool(S0);
    seedContentPipeline(S0);
  }

  /* ---------- the published pool that the catalogue reads ----------
     `data.js` calls this through the resolver installed at the foot of
     this module, so every existing catalogue lookup — public,
     tenant, Faculty, Student — resolves against it. Two consequences,
     both deliberate:
       · newly PUBLISHED content appears everywhere with no call-site
         change and no second catalogue;
       · content that is not published is not reachable through any of
         them, including by hand-typed hash route.
     It returns null while the state layer is seeding or migrating, so
     those paths fall back to the seed array they are describing. */
  var contentSeeding = false;
  var pubCache = null, pubCacheSeq = -1;

  /* ============================================================
     CANONICAL ACADEMIC STRUCTURE — Programme / Department → Course
     (Implementation 07.1, open decision D3)

     The structure used to be two frozen arrays in data.js, which meant
     new academic structure needed a developer. It is now governed state
     with the SAME shape, seeded from those arrays so every existing id
     — `civil-engineering`, `soil-mechanics`, … — is unchanged and every
     stored reference to them still resolves.

     WHAT IS BUILT: create, and rename / re-describe / re-parent.
     WHAT IS NOT: retire or delete. That is deliberate and unchanged —
     these identifiers are load-bearing for every access record,
     academic mapping, Faculty mapping and assignment, and D3's own
     recommendation is to "scope create first and treat retire
     separately". Nothing is deleted anywhere in this build.
     ============================================================ */

  /* Seed rows carry the same provenance line every other record has, so
     a seeded Course and a platform-created one are told apart honestly
     without a second collection. */
  function seedStructureRows(rows) {
    return rows.map(function (r) {
      var copy = JSON.parse(JSON.stringify(r));
      copy.source = 'seed';
      copy.createdBy = null;
      copy.createdAt = null;
      copy.updatedAt = null;
      return copy;
    });
  }

  /* `structureSeeding` does for the structure resolver what
     `contentSeeding` does for the published-pool resolver: while a NEW
     state object is being built, the resolver must not answer out of the
     OUTGOING state — a reset would otherwise be able to inherit the very
     Courses it is resetting away.

     ⚠ HONEST STATUS: this is DEFENCE IN DEPTH, not a load-bearing fix
     today. No function `initialState()` calls currently performs a
     structure lookup, so removing the flag changes no observable
     behaviour and no assertion can distinguish it. It is kept because
     the seeding path is exactly where such a lookup would one day be
     added, and because the resolver it guards is the same shape as the
     published-pool resolver that DOES need its equivalent. */
  var structureSeeding = false;
  function structureSource(kind) {
    if (structureSeeding) { return null; }
    if (typeof S === 'undefined' || !S) { return null; }
    var rows = kind === 'groupings' ? S.groupings : S.courses;
    return (Array.isArray(rows) && rows.length) ? rows : null;
  }

  function publicShape(rec) {
    return {
      id: rec.id, courseId: rec.courseId, name: rec.name,
      summary: rec.summary, description: rec.description,
      outcomes: rec.outcomes.slice(), technologies: rec.technologies.slice(),
      /* Implementation 06 — the version the public actually sees. It is
         written by the FIRST publication and then only by a Super Admin
         RELEASE. A version candidate sitting in the workflow, however
         far it has got, never appears here. */
      versionLabel: rec.versionLabel || '',
      /* 07.3 — the Vendor's preview / demo video.

         ⚠ THIS PROJECTION IS THE PUBLICATION BOUNDARY. `publishedPool()`
         maps ONLY records at `PUBLISHED` through this whitelist, so
         adding the field here is precisely what makes the video public
         on publication and never one moment earlier: an unpublished
         draft carrying a video is not in the pool at all, and no other
         field of the record leaks with it. */
      previewVideo: rec.previewVideo || null
    };
  }

  function publishedPool() {
    if (contentSeeding) { return null; }
    if (typeof S === 'undefined' || !S || !Array.isArray(S.contentRecords)) { return null; }
    if (pubCache && pubCacheSeq === S.seq.contentEvent) { return pubCache; }
    pubCache = S.contentRecords
      .filter(function (r) { return r.status === CONTENT_STATUS.PUBLISHED; })
      .map(publicShape);
    pubCacheSeq = S.seq.contentEvent;
    return pubCache;
  }

  function contentTouched() {
    S.seq.contentEvent += 1;
    pubCache = null;
    return S.seq.contentEvent;
  }

  /* ---------- actors, scope and the prototype role pointers ---------- */

  function contentActors(role) {
    return S.contentActors.filter(function (a) { return !role || a.role === role; });
  }
  function contentActor(id) {
    return S.contentActors.filter(function (a) { return a.id === id; })[0] || null;
  }
  function contentRoleLabel(role) { return CONTENT_ROLE_LABEL[role] || role; }

  /* ACTIVE assignments only. Implementation 06 made this collection
     governed state: a removed scope is kept for the audit trail but must
     stop carrying authority the moment it is withdrawn, and every scope
     check in the build goes through this one function — so withdrawing a
     scope in the Super Admin surface takes effect everywhere at once,
     with no second scope store to keep in step. */
  function assignmentsFor(actorId) {
    return S.contentRoleAssignments.filter(function (m) {
      return m.actorId === actorId && m.status !== 'removed';
    });
  }
  /* Every row, withdrawn ones included — the governance and audit view. */
  function allAssignmentsFor(actorId) {
    return S.contentRoleAssignments.filter(function (m) { return m.actorId === actorId; });
  }
  /* Which canonical Courses an actor is authorised on. A platform-scope
     assignment ('all') covers every canonical Course. */
  function actorCourseIds(actorId) {
    var rows = assignmentsFor(actorId);
    if (rows.some(function (m) { return m.scope === 'all'; })) {
      return data.courses().map(function (c) { return c.id; });
    }
    var out = [];
    rows.forEach(function (m) {
      if (m.scope === 'course' && m.courseId && out.indexOf(m.courseId) === -1) { out.push(m.courseId); }
      if (m.scope === 'experiment' && m.experimentId) {
        var rec = contentRecord(m.experimentId);
        if (rec && rec.courseId && out.indexOf(rec.courseId) === -1) { out.push(rec.courseId); }
      }
    });
    return out;
  }
  /* Which canonical Courses an actor may create a NEW record inside.
     This is a DIFFERENT question from `actorCourseIds`, and conflating
     the two was a real authority defect: an Experiment-scope assignment
     names one existing Experiment (STK31-41), so it widens to that
     Experiment's Course for READING, but it cannot authorise a brand-new
     Experiment — the new record gets a new id that no Experiment-scope
     row can ever name. `actorCoversRecord` would then refuse every edit,
     and the Vendor was handed a frozen draft with a false explanation.
     Creation therefore asks for Course-level or platform-level scope. */
  function actorCreateCourseIds(actorId) {
    var rows = assignmentsFor(actorId);
    if (rows.some(function (m) { return m.scope === 'all'; })) {
      return data.courses().map(function (c) { return c.id; });
    }
    var out = [];
    rows.forEach(function (m) {
      if (m.scope === 'course' && m.courseId && out.indexOf(m.courseId) === -1) { out.push(m.courseId); }
    });
    return out;
  }
  /* The assignment an actor actually holds, said in the actor's own
     terms. A Course list alone reported an Experiment-scope assignment
     as authority over the whole Course, which is not what was granted. */
  function actorScopeText(actorId) {
    var rows = assignmentsFor(actorId);
    if (!rows.length) { return 'No assignment'; }
    if (rows.some(function (m) { return m.scope === 'all'; })) { return 'Platform-wide (all Courses)'; }
    var parts = [];
    rows.forEach(function (m) {
      if (m.scope === 'course' && m.courseId) {
        var c = data.course(m.courseId);
        parts.push(c ? c.name : m.courseId);
      } else if (m.scope === 'experiment' && m.experimentId) {
        var rec = contentRecord(m.experimentId);
        parts.push((rec ? rec.name : m.experimentId) + ' (this Experiment only)');
      }
    });
    return parts.join(', ') || 'No assignment';
  }
  function actorHasPlatformScope(actorId) {
    return assignmentsFor(actorId).some(function (m) { return m.scope === 'all'; });
  }
  /* Is this actor authorised on this specific record? Experiment-scope
     assignments are honoured directly so several people can be
     associated with one Experiment (STK31-41). */
  function actorCoversRecord(actorId, rec) {
    if (!rec) { return false; }
    var rows = assignmentsFor(actorId);
    return rows.some(function (m) {
      if (m.scope === 'all') { return true; }
      if (m.scope === 'course') { return m.courseId === rec.courseId; }
      if (m.scope === 'experiment') { return m.experimentId === rec.id; }
      return false;
    });
  }

  function protoVendorId() { return S.protoVendorId || null; }
  function protoReviewerId() { return S.protoReviewerId || null; }
  function protoManagerId() { return S.protoManagerId || null; }
  function setProtoVendor(id) {
    var a = id ? contentActor(id) : null;
    S.protoVendorId = (a && a.role === CONTENT_ROLE.VENDOR) ? a.id : null;
    save();
  }
  function setProtoReviewer(id) {
    var a = id ? contentActor(id) : null;
    S.protoReviewerId = (a && a.role === CONTENT_ROLE.REVIEWER) ? a.id : null;
    save();
  }
  function setProtoManager(id) {
    var a = id ? contentActor(id) : null;
    S.protoManagerId = (a && a.role === CONTENT_ROLE.MANAGER) ? a.id : null;
    save();
  }
  function protoVendor() { return contentActor(S.protoVendorId); }
  function protoReviewer() { return contentActor(S.protoReviewerId); }
  function protoManager() { return contentActor(S.protoManagerId); }

  /* ---------- content queries ---------- */

  function contentRecords() { return S.contentRecords; }
  function contentRecord(id) {
    return S.contentRecords.filter(function (r) { return r.id === id; })[0] || null;
  }
  function contentStatusMeta(status) {
    return CONTENT_STATUS_META[status] || { label: status, badge: 'b-neutral', icon: 'circle', holder: null };
  }
  function contentContext(rec) {
    if (!rec) { return null; }
    var c = data.course(rec.courseId);
    var g = c ? data.grouping(c.groupingId) : null;
    return { course: c, grouping: g };
  }

  /* What a Vendor sees: the records they created. Ownership, not the
     course assignment, is the visibility rule — a Vendor must not read
     another Vendor's draft even inside a course they both work on. */
  function contentForVendor(actorId, opts) {
    var o = opts || {};
    return S.contentRecords.filter(function (r) {
      if (r.createdBy !== actorId) { return false; }
      if (o.status && r.status !== o.status) { return false; }
      return true;
    }).sort(byContentRecency);
  }

  /* What an Academic Reviewer sees: submitted work inside their
     assignment. Seeded published content carries no submission and is
     not review work, so it is not in the queue. */
  function contentForReviewer(actorId, opts) {
    var o = opts || {};
    return S.contentRecords.filter(function (r) {
      if (r.origin === 'seed') { return false; }
      if (!actorCoversRecord(actorId, r)) { return false; }
      if (o.status && r.status !== o.status) { return false; }
      if (o.queue && r.status !== CONTENT_STATUS.ACADEMIC_REVIEW &&
                     r.status !== CONTENT_STATUS.CHANGES_ACADEMIC_RECHECK) { return false; }
      return true;
    }).sort(byContentRecency);
  }

  /* What a Content Manager sees: the Content Library — the whole
     canonical pool inside their assignment, published and pipeline
     alike (STK31-06 / STK31-09). */
  function contentForManager(actorId, opts) {
    var o = opts || {};
    return S.contentRecords.filter(function (r) {
      if (!actorCoversRecord(actorId, r)) { return false; }
      if (o.status && r.status !== o.status) { return false; }
      if (o.queue && r.status !== CONTENT_STATUS.CONTENT_REVIEW) { return false; }
      return true;
    }).sort(byContentRecency);
  }

  function byContentRecency(a, b) {
    return (b.eventSeq || 0) - (a.eventSeq || 0);
  }

  function academicReviewsFor(recordId) {
    return S.academicReviews.filter(function (r) { return r.recordId === recordId; })
      .sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
  }
  function academicReviewsBy(reviewerId) {
    return S.academicReviews.filter(function (r) { return r.reviewerId === reviewerId; })
      .sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
  }
  function publicationRecords() { return S.publicationRecords; }
  function publicationFor(recordId) {
    return S.publicationRecords.filter(function (p) { return p.recordId === recordId; })[0] || null;
  }

  /* ---------- validation ----------
     Technology-specific: a field is required only for a technology the
     Vendor actually selected. Package metadata is never asked of Web,
     and a hosted URL is never asked of VR / AR / MR (STK31-37). */

  function isHttpUrl(value) {
    var v = String(value || '').trim();
    if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v)) { return false; }
    return true;
  }

  function deliveryOf(rec, tech) {
    return (rec.delivery && rec.delivery[tech]) || {};
  }

  /* `stage` is 'draft' (save — almost nothing is required) or 'submit'
     (the readiness rule before an Academic Reviewer is asked to look). */
  function validateContent(fields, stage, opts) {
    var o = opts || {};
    var errs = [];
    var name = String(fields.name || '').trim();
    if (!name) { errs.push({ field: 'f-name', message: 'Enter an experiment name.' }); }
    else if (nameTaken(name, o.exceptId)) {
      errs.push({ field: 'f-name', message: 'Another experiment already uses this name. Choose a different one.' });
    }
    if (!fields.courseId) { errs.push({ field: 'f-course', message: 'Select the Course this experiment belongs to.' }); }
    if (stage !== 'submit') { return errs; }

    if (!String(fields.summary || '').trim()) {
      errs.push({ field: 'f-summary', message: 'Enter a short summary — it appears in the catalogue listing.' });
    }
    if (!String(fields.description || '').trim()) {
      errs.push({ field: 'f-description', message: 'Enter a description of the experiment.' });
    }
    if (!String(fields.versionLabel || '').trim()) {
      errs.push({ field: 'f-version', message: 'Enter a version label for this submission.' });
    }
    var techs = fields.technologies || [];
    if (!techs.length) {
      errs.push({ field: 'f-tech', message: 'Select at least one technology this experiment is available in.' });
    }
    techs.forEach(function (t) {
      var def = data.TECHNOLOGIES[t];
      if (!def) { return; }
      var d = (fields.delivery && fields.delivery[t]) || {};
      if (def.delivery === 'hosted') {
        var url = String(d.url || '').trim();
        if (!url) {
          errs.push({ field: 'f-' + t + '-url', message: def.label + ': enter the hosted experience URL.' });
        } else if (!isHttpUrl(url)) {
          errs.push({ field: 'f-' + t + '-url',
            message: def.label + ': enter a full URL beginning with https:// (for example https://xr.example.edu/experiment).' });
        }
      } else {
        var ref = String(d.packageRef || '').trim();
        var lab = String(d.packageLabel || '').trim();
        if (!ref && !lab && !d.packageFile) {
          errs.push({ field: 'f-' + t + '-pkg',
            message: def.label + ': add package reference information so the submission can be reviewed.' });
        }
      }
      if (!String(d.runtime || '').trim()) {
        errs.push({ field: 'f-' + t + '-runtime',
          message: def.label + ': state the device / runtime requirement.' });
      }
    });
    return errs;
  }

  function nameTaken(name, exceptId) {
    var n = data.norm(name);
    return S.contentRecords.some(function (r) {
      return r.id !== exceptId && data.norm(r.name) === n;
    });
  }

  /* Readiness the Academic Reviewer's approval depends on. Learning
     Outcomes are the Reviewer's own object (STK31-08); approving with
     none would publish an Experiment whose public Learning outcomes
     card is empty, so at least one is required to approve. */
  /* What the Academic Reviewer actually validated. A content-gate return
     hands the whole submission back to the Vendor, so the work that comes
     back may not be the work that was approved: a different Course,
     different technologies or a rewritten description would otherwise
     reach publication carrying an approval nobody gave it. This
     fingerprint is what `submitContent()` compares. Delivery detail and
     documentation are deliberately NOT in it — they are the technical
     submission the CONTENT gate reviews, and correcting them is the whole
     point of a content-gate return. */
  function academicFingerprint(rec) {
    return JSON.stringify({
      courseId: rec.courseId,
      name: String(rec.name || '').trim(),
      summary: String(rec.summary || '').trim(),
      description: String(rec.description || '').trim(),
      technologies: data.sortTech(rec.technologies || []),
      outcomes: (rec.outcomes || []).slice()
    });
  }

  function academicReadiness(rec) {
    var blockers = [];
    if (!rec) { return { ok: false, blockers: ['This submission no longer exists.'] }; }
    /* 07.3 — a record the CONTENT MANAGER returned for an ACADEMIC
       reason is awaiting this reviewer's decision exactly as a fresh
       submission is. Without this clause `reviewerCanAct()` said yes and
       `approveAcademic()` still refused, so the record reached the
       reviewer's queue and could not be moved out of it — a dead end. */
    if (rec.status !== CONTENT_STATUS.ACADEMIC_REVIEW &&
        rec.status !== CONTENT_STATUS.CHANGES_ACADEMIC_RECHECK) {
      blockers.push('This submission is not currently awaiting academic review.');
    }
    if (!rec.outcomes.length) {
      blockers.push('Record at least one Learning Outcome before approving.');
    }
    return { ok: !blockers.length, blockers: blockers };
  }

  /* Readiness the FIRST PUBLICATION depends on. Every one of these is
     re-checked inside `publishContent()`, so a hand-driven action
     cannot bypass the list by avoiding the screen. */
  function publishReadiness(rec) {
    var blockers = [];
    if (!rec) { return { ok: false, blockers: ['This content record no longer exists.'] }; }
    if (rec.status === CONTENT_STATUS.PUBLISHED) {
      return { ok: false, blockers: ['This experiment is already published.'] };
    }
    if (rec.status !== CONTENT_STATUS.CONTENT_REVIEW) {
      blockers.push('Publication is available only for an item in content readiness review.');
    }
    if (!rec.academicReview || rec.academicReview.decision !== 'approved') {
      blockers.push('No academic approval is recorded for this submission.');
    } else if (typeof rec.academicReview.fingerprint === 'string' &&
               rec.academicReview.fingerprint !== academicFingerprint(rec)) {
      /* The last line of defence. If the academic content has moved since
         the approval was given, the approval is not an approval of THIS
         object, and it must not carry it into the catalogue. */
      blockers.push('The academic content has changed since it was approved — it must be reviewed again.');
    }
    if (!data.course(rec.courseId)) {
      blockers.push('The canonical Course for this experiment is missing.');
    }
    if (!String(rec.name || '').trim()) { blockers.push('The experiment name is missing.'); }
    if (!String(rec.summary || '').trim()) { blockers.push('The catalogue summary is missing.'); }
    if (!String(rec.description || '').trim()) { blockers.push('The description is missing.'); }
    if (!String(rec.versionLabel || '').trim()) { blockers.push('The version label is missing.'); }
    if (!rec.outcomes.length) { blockers.push('No Learning Outcomes are recorded.'); }
    if (!rec.technologies.length) { blockers.push('No technology variant is available.'); }
    rec.technologies.forEach(function (t) {
      var def = data.TECHNOLOGIES[t];
      if (!def) { blockers.push('Unknown technology "' + t + '".'); return; }
      var d = deliveryOf(rec, t);
      if (def.delivery === 'hosted') {
        if (!isHttpUrl(d.url)) { blockers.push(def.label + ': the hosted experience URL is missing or not a valid URL.'); }
      } else if (!String(d.packageRef || '').trim() && !String(d.packageLabel || '').trim() && !d.packageFile) {
        blockers.push(def.label + ': package reference information is missing.');
      }
      if (!String(d.runtime || '').trim()) { blockers.push(def.label + ': the device / runtime requirement is missing.'); }
    });
    return { ok: !blockers.length, blockers: blockers };
  }

  /* ---------- history ---------- */

  /* ---------- SUPPORTING REFERENCES ON A CHANGE REQUEST (07.3) ----------
     The stakeholder asked that a reviewer requesting changes be able to
     attach supporting material — a reference document, a screenshot, a
     link. This is DIFFERENT from the supporting documentation the Vendor
     uploaded with the Experiment, and the two are never mixed.

     ⚠ HONESTY BOUNDARY. This prototype has no server and no upload. A
     `link` reference stores the URL the reviewer typed. A `file`
     reference stores ONLY the browser-reported NAME and SIZE of a file
     the reviewer picked — the bytes are never read, never held and never
     transmitted. Every surface that renders one says so. Nothing here
     pretends a file was uploaded. */
  var CONTENT_REF_KIND = { LINK: 'link', FILE: 'file' };

  function normalizeContentRefs(list) {
    if (!Array.isArray(list)) { return []; }
    var out = [];
    list.forEach(function (r) {
      if (!r) { return; }
      var kind = r.kind === CONTENT_REF_KIND.FILE ? CONTENT_REF_KIND.FILE : CONTENT_REF_KIND.LINK;
      var label = String(r.label || '').trim();
      if (kind === CONTENT_REF_KIND.LINK) {
        var url = String(r.url || '').trim();
        if (!url) { return; }
        /* ⚠ SCHEME-CHECKED — 07.3 adversarial fix. This was the only URL
           field in the build that skipped `isHttpUrl`, while the hosted
           delivery link and the preview video both use it. `refsHTML`
           interpolates the value into an href, so an unchecked string let
           a reference labelled "Marked-up spec" point at `javascript:`,
           `data:`, `file:` or a protocol-relative host. Rejecting it here
           keeps a bad value out of state entirely. */
        if (!isHttpUrl(url)) { return; }
        out.push({ kind: kind, label: label || url, url: url, note: String(r.note || '').trim() });
      } else {
        var fileName = String(r.fileName || '').trim();
        if (!fileName) { return; }
        var size = Number(r.fileSize);
        out.push({
          kind: kind, label: label || fileName, fileName: fileName,
          fileSize: isFinite(size) && size >= 0 ? size : null,
          /* Stated on the record itself, not only in the UI copy. */
          storedBytes: false,
          note: String(r.note || '').trim()
        });
      }
    });
    return out.slice(0, 10);
  }

  function pushContentEvent(rec, kind, label, actor, at, note, refs) {
    var seq = contentTouched();
    rec.history.unshift({
      seq: seq, kind: kind, label: label,
      /* The actor's ID as well as their name. A name is what the entry
         DISPLAYS; the id is what the governance surface can still match
         on after a role scope has been withdrawn, so "what did this
         person decide?" survives losing the authority to decide it.
         Null for a platform action, which has no actor record. */
      actorId: (actor && actor.id) ? actor.id : null,
      actorName: actor ? actor.name : null,
      actorRole: actor ? (CONTENT_ROLE_LABEL[actor.role] || actor.role) : null,
      at: at || new Date().toISOString(),
      note: note || '',
      /* Empty, never absent — every reader expects an array. */
      refs: normalizeContentRefs(refs)
    });
    rec.eventSeq = seq;
    return seq;
  }

  /* ---------- Vendor actions ----------
     Every one refuses on authority before it writes. A hand-typed route
     reaches the same function, so the refusal is the state layer's, not
     the screen's. */

  /* ---------- VIEWING AND MUTATING ARE DIFFERENT QUESTIONS ----------
     Implementation 06 correction. These predicates are deliberately
     separate, and only one of them consults the live role assignment.

     `canViewHistoricalRecord` — OWNERSHIP ALONE. A Vendor never loses
     sight of work they created. Withdrawing a role scope is a governance
     act about FUTURE authority; it must never delete, hide or orphan a
     record, a submission, a decision or a history entry. Every Vendor
     READ path uses this, and it must never acquire a scope term.

     `canMutateVendorRecord` — OWNERSHIP *and* the LIFECYCLE *and* the
     LIVE role assignment. Changing a record is an act of authority over
     content in a Course, so it requires an assignment in force RIGHT
     NOW. The moment the relevant scope is withdrawn the record becomes
     READ-ONLY: no edit, no submit, no resubmit, no Course change, no
     technology, package or metadata change. Restoring the scope returns
     the authority wherever the lifecycle already allows it — nothing
     else has to be repaired, because nothing was destroyed.

     ⚠ THIS REPLACES the earlier split, which ran editing on ownership
     alone and gated only submission. That left an out-of-scope Vendor
     holding mutation authority over content in a Course they no longer
     held; and because `updateContentDraft` also asks whether the Vendor
     may file into the Course the FORM is offering, re-filing the record
     into a Course they DID still hold became the only way to save it —
     the build actively steered a withdrawn Vendor into moving the
     Experiment out from under its Course. Withdrawn authority is
     withdrawn authority. */
  function canViewHistoricalRecord(rec, actorId) {
    return !!rec && !!actorId && rec.createdBy === actorId;
  }
  function canMutateVendorRecord(rec, actorId) {
    if (!canViewHistoricalRecord(rec, actorId)) { return false; }
    if (VENDOR_EDITABLE.indexOf(rec.status) === -1) { return false; }
    return actorCoversRecord(actorId, rec);
  }
  /* The record is the Vendor's own and the workflow has handed it back,
     but no live assignment covers it any more. Read-only for a reason
     the screens must name differently from "somebody else is holding
     it", so they can say which of the two is true. */
  function vendorScopeWithdrawn(rec, actorId) {
    return canViewHistoricalRecord(rec, actorId) && !actorCoversRecord(actorId, rec);
  }

  /* Editing and submitting now ask the SAME authority question and
     differ only in what the workflow does next. Both names are kept
     because the screens read more honestly for it. */
  function vendorCanEdit(rec, actorId) { return canMutateVendorRecord(rec, actorId); }
  function vendorCanSubmit(rec, actorId) { return canMutateVendorRecord(rec, actorId); }

  function vendorCanCreateIn(actorId, courseId) {
    return actorCreateCourseIds(actorId).indexOf(courseId) !== -1;
  }

  function createContentDraft(actorId, fields) {
    var actor = contentActor(actorId);
    if (!actor || actor.role !== CONTENT_ROLE.VENDOR) { return null; }
    if (!vendorCanCreateIn(actorId, fields.courseId)) { return null; }
    if (validateContent(fields, 'draft').length) { return null; }
    S.seq.contentRec += 1;
    var now = new Date().toISOString();
    var rec = newContentRecord({
      id: 'EXP-' + util.pad3(S.seq.contentRec),
      courseId: fields.courseId, name: String(fields.name).trim(),
      summary: fields.summary || '', description: fields.description || '',
      technologies: fields.technologies || [], delivery: fields.delivery || {},
      /* 07.3 — carried on CREATE, not only on edit. Without this a
         preview video typed on the Vendor's "create experiment" form was
         silently dropped on the way in, and the screen had to write it
         again with a second call. */
      previewVideo: fields.previewVideo || null,
      documents: fields.documents || [], vendorNotes: fields.vendorNotes || '',
      versionLabel: fields.versionLabel || '', status: CONTENT_STATUS.DRAFT,
      origin: 'vendor', createdBy: actorId, createdAt: now, updatedAt: now
    });
    S.contentRecords.push(rec);
    pushContentEvent(rec, 'created', 'Draft created', actor, now, '');
    save();
    return rec;
  }

  function updateContentDraft(actorId, recordId, fields) {
    var rec = contentRecord(recordId);
    var actor = contentActor(actorId);
    if (!rec || !actor || actor.role !== CONTENT_ROLE.VENDOR) { return null; }
    /* Authority over the record AS IT STANDS — judged on the Course it
       is filed under NOW, never on the one the form happens to be
       offering. This is what makes a withdrawn scope unlaunderable: the
       answer cannot be changed by changing the field. */
    if (!canMutateVendorRecord(rec, actorId)) { return null; }
    /* And, separately, authority to file into the Course being chosen —
       so an in-scope Vendor still cannot MOVE an Experiment into a
       Course they do not hold.

       ⚠ ONLY WHEN THE COURSE IS ACTUALLY CHANGING. This gate asks the
       creation question (`actorCreateCourseIds`: platform or Course
       scope, because a new record gets an id no Experiment-scope
       assignment can name). Asking it on every save refused an
       Experiment-scoped Vendor editing their OWN, in-scope record with
       its Course untouched — an edit `canMutateVendorRecord` above has
       already authorised. Saving a record where it already sits is not
       a move, and does not need move authority. */
    if (fields.courseId !== rec.courseId && !vendorCanCreateIn(actorId, fields.courseId)) { return null; }
    if (validateContent(fields, 'draft', { exceptId: rec.id }).length) { return null; }
    rec.courseId = fields.courseId;
    rec.name = String(fields.name).trim();
    rec.summary = fields.summary || '';
    rec.description = fields.description || '';
    rec.technologies = data.sortTech(fields.technologies || []);
    rec.delivery = fields.delivery || {};
    rec.previewVideo = normalizePreviewVideo(fields.previewVideo, actorId, rec.previewVideo);
    rec.documents = fields.documents || [];
    rec.vendorNotes = fields.vendorNotes || '';
    rec.versionLabel = fields.versionLabel || '';
    rec.updatedAt = new Date().toISOString();
    contentTouched();
    save();
    return rec;
  }

  /* Submit, or correct-and-resubmit. A resubmission increments the
     correction-round counter and returns to the gate that asked for the
     change — the Content Manager's metadata question does not send the
     work back through academic validation it has already passed. */
  function submitContent(actorId, recordId) {
    var rec = contentRecord(recordId);
    var actor = contentActor(actorId);
    if (!rec || !actor || actor.role !== CONTENT_ROLE.VENDOR) { return null; }
    if (!canMutateVendorRecord(rec, actorId)) { return null; }
    if (validateContent(rec, 'submit', { exceptId: rec.id }).length) { return null; }

    var now = new Date().toISOString();
    var wasReturned = rec.status === CONTENT_STATUS.CHANGES_ACADEMIC || rec.status === CONTENT_STATUS.CHANGES_CONTENT;
    var target = CONTENT_STATUS.ACADEMIC_REVIEW;
    var academicStale = false;
    if (wasReturned) {
      rec.revision += 1;
      rec.resubmitted = true;
      target = rec.returnedGate === 'content' ? CONTENT_STATUS.CONTENT_REVIEW : CONTENT_STATUS.ACADEMIC_REVIEW;
      /* A content-gate return goes straight back to the Content Manager —
         but ONLY while what the Academic Reviewer validated is still what
         is being submitted. If the Vendor changed the Course, the name,
         the description or the technology availability while correcting,
         the existing approval no longer describes this work, so it is
         withdrawn and the submission goes back through academic review.
         Otherwise an item could publish on an approval granted for
         different content. */
      if (target === CONTENT_STATUS.CONTENT_REVIEW) {
        /* FAIL CLOSED. Going straight back to the publication gate is
           only safe while the approval can be SHOWN to describe the work
           being resubmitted. A missing approval, or one written by a
           build that recorded no fingerprint, cannot be shown to — so it
           does not get the benefit of the doubt. */
        var fp = rec.academicReview && rec.academicReview.fingerprint;
        if (typeof fp !== 'string' || fp !== academicFingerprint(rec)) {
          academicStale = true;
          target = CONTENT_STATUS.ACADEMIC_REVIEW;
          rec.academicReview = null;
        }
      }
    } else {
      rec.resubmitted = false;
    }
    rec.status = target;
    rec.returnedGate = null;
    rec.submittedBy = actorId;
    rec.submittedAt = now;
    rec.updatedAt = now;
    pushContentEvent(rec, wasReturned ? 'resubmitted' : 'submitted',
      wasReturned
        ? 'Corrected and resubmitted (v' + rec.revision + ') — ' +
          (target === CONTENT_STATUS.CONTENT_REVIEW ? 'content readiness review' : 'academic review')
        : 'Submitted for academic review (v' + rec.revision + ')',
      actor, now,
      academicStale
        ? 'The academic content changed while this was being corrected, so the earlier academic approval ' +
          'no longer applies and the submission returns to academic review.'
        : '');
    save();
    return rec;
  }

  /* ---------- Academic Reviewer actions ---------- */

  function reviewerCanAct(rec, actorId) {
    var actor = contentActor(actorId);
    if (!rec || !actor || actor.role !== CONTENT_ROLE.REVIEWER) { return false; }
    if (!actorCoversRecord(actorId, rec)) { return false; }
    /* 07.3 — a record the Content Manager returned for an ACADEMIC
       reason is with this reviewer exactly as a fresh submission is. */
    return rec.status === CONTENT_STATUS.ACADEMIC_REVIEW ||
           rec.status === CONTENT_STATUS.CHANGES_ACADEMIC_RECHECK;
  }

  /* Learning Outcomes are the Academic Reviewer's object. They are
     editable while the Reviewer holds the submission and never after
     publication — the published outcomes are what the public catalogue
     and every entitled Student are reading. */
  function outcomesEditable(rec, actorId) { return reviewerCanAct(rec, actorId); }

  function addOutcome(actorId, recordId, text) {
    var rec = contentRecord(recordId);
    if (!outcomesEditable(rec, actorId)) { return null; }
    var t = String(text || '').trim();
    if (!t) { return null; }
    rec.outcomes.push(t);
    rec.updatedAt = new Date().toISOString();
    contentTouched();
    save();
    return rec;
  }
  function updateOutcome(actorId, recordId, index, text) {
    var rec = contentRecord(recordId);
    if (!outcomesEditable(rec, actorId)) { return null; }
    var t = String(text || '').trim();
    if (!t || index < 0 || index >= rec.outcomes.length) { return null; }
    rec.outcomes[index] = t;
    rec.updatedAt = new Date().toISOString();
    contentTouched();
    save();
    return rec;
  }
  function deleteOutcome(actorId, recordId, index) {
    var rec = contentRecord(recordId);
    if (!outcomesEditable(rec, actorId)) { return null; }
    if (index < 0 || index >= rec.outcomes.length) { return null; }
    rec.outcomes.splice(index, 1);
    rec.updatedAt = new Date().toISOString();
    contentTouched();
    save();
    return rec;
  }
  function moveOutcome(actorId, recordId, index, delta) {
    var rec = contentRecord(recordId);
    if (!outcomesEditable(rec, actorId)) { return null; }
    var to = index + delta;
    if (index < 0 || index >= rec.outcomes.length || to < 0 || to >= rec.outcomes.length) { return null; }
    var moved = rec.outcomes.splice(index, 1)[0];
    rec.outcomes.splice(to, 0, moved);
    rec.updatedAt = new Date().toISOString();
    contentTouched();
    save();
    return rec;
  }

  function approveAcademic(actorId, recordId, comment) {
    var rec = contentRecord(recordId);
    var actor = contentActor(actorId);
    if (!reviewerCanAct(rec, actorId)) { return null; }
    if (!academicReadiness(rec).ok) { return null; }
    var now = new Date().toISOString();
    S.seq.review += 1;
    var review = {
      id: 'ACR-' + util.pad3(S.seq.review), recordId: rec.id,
      reviewerId: actorId, reviewerName: actor.name,
      decision: 'approved', comment: String(comment || '').trim(),
      revision: rec.revision, outcomes: rec.outcomes.slice(), at: now,
      /* What was academically validated — see `academicFingerprint()`. */
      fingerprint: academicFingerprint(rec)
    };
    S.academicReviews.push(review);
    rec.academicReview = JSON.parse(JSON.stringify(review));
    rec.status = CONTENT_STATUS.CONTENT_REVIEW;
    rec.returnedGate = null;
    rec.updatedAt = now;
    pushContentEvent(rec, 'approved', 'Academic validation complete', actor, now, review.comment);
    save();
    return rec;
  }

  /* PM-14's return path, at the academic gate. A comment is required:
     a submission returned without a reason is not a review. */
  function requestChangesAcademic(actorId, recordId, comment, refs) {
    var rec = contentRecord(recordId);
    var actor = contentActor(actorId);
    if (!reviewerCanAct(rec, actorId)) { return null; }
    var text = String(comment || '').trim();
    if (!text) { return null; }
    var refList = normalizeContentRefs(refs);
    var now = new Date().toISOString();
    S.seq.review += 1;
    var review = {
      id: 'ACR-' + util.pad3(S.seq.review), recordId: rec.id,
      reviewerId: actorId, reviewerName: actor.name,
      decision: 'changes_requested', comment: text,
      revision: rec.revision, outcomes: rec.outcomes.slice(), at: now,
      refs: refList
    };
    S.academicReviews.push(review);
    rec.status = CONTENT_STATUS.CHANGES_ACADEMIC;
    rec.returnedGate = 'academic';
    rec.resubmitted = false;
    rec.updatedAt = now;
    pushContentEvent(rec, 'changes', 'Changes requested — academic review', actor, now, text, refList);
    save();
    return rec;
  }

  /* ---------- Content Manager actions ---------- */

  function managerCanAct(rec, actorId) {
    var actor = contentActor(actorId);
    if (!rec || !actor || actor.role !== CONTENT_ROLE.MANAGER) { return false; }
    return actorCoversRecord(actorId, rec);
  }
  function managerCanPublish(rec, actorId) {
    return managerCanAct(rec, actorId) && publishReadiness(rec).ok;
  }

  /* Canonical content metadata (STK31-09). The Content Manager may
     correct the canonical catalogue fields of an item in the library —
     and NOT its Learning Outcomes, which stay academically owned
     (STK31-08), and NOT its technology delivery, which is the Vendor's
     technical submission (STK31-08). */
  /* Canonical metadata is a CONTENT LIBRARY action. It applies to content
     the Content Manager actually holds — an item at their own readiness
     gate, or one already published — and never to a draft the Vendor is
     still writing or a submission the Academic Reviewer is holding.
     Rewriting either would change the work under the person doing it, and
     could move a submission out of its assigned reviewer's scope. */
  function canonicalEditable(rec) {
    return !!rec && (rec.status === CONTENT_STATUS.CONTENT_REVIEW || rec.status === CONTENT_STATUS.PUBLISHED);
  }

  /* May this Content Manager file THIS record into THAT Course? The
     same question `updateCanonicalMetadata` asks, exposed so the form
     can offer only Courses the save will accept, and can report a
     refusal for the reason it actually happened rather than guessing. */
  function managerCanFileInto(actorId, recordId, courseId) {
    var rec = contentRecord(recordId);
    if (!rec) { return false; }
    if (courseId === rec.courseId) { return true; }
    return assignmentsFor(actorId).some(function (m) {
      return m.scope === 'all' || (m.scope === 'course' && m.courseId === courseId);
    });
  }

  function updateCanonicalMetadata(actorId, recordId, fields) {
    var rec = contentRecord(recordId);
    var actor = contentActor(actorId);
    if (!managerCanAct(rec, actorId)) { return null; }
    if (!canonicalEditable(rec)) { return null; }
    var name = String(fields.name || '').trim();
    if (!name || nameTaken(name, rec.id)) { return null; }
    if (!data.course(fields.courseId)) { return null; }
    /* AUTHORITY ON THE DESTINATION, NOT ONLY ON THE ORIGIN.
       `managerCanAct` asked whether this manager covers the record AS IT
       STANDS. Re-filing it into another Course is a second authority
       question, and without this gate a Course-scoped Content Manager
       could move an Experiment into a Course they hold no assignment for
       — placing it under another person's authority without that person
       acting, and (because `actorCoversRecord` reads the CURRENT course)
       removing it from their own reach in the same keystroke. Scope is
       Super-Admin-governed (STK31-41); it is not something a metadata
       edit may hand away. A platform-scope manager is unaffected.

       An EXPERIMENT-scope assignment does not satisfy this either. It
       names one Experiment and carries authority over that Experiment's
       content — not over WHERE IT SITS in a structure that is
       platform-controlled (`STK31-10`). Letting it re-file the record
       anywhere would move the Experiment out from under whichever
       Course-scoped people currently reach it, on the authority of
       somebody who holds no Course at all. */
    if (!managerCanFileInto(actorId, rec.id, fields.courseId)) { return null; }
    rec.name = name;
    rec.courseId = fields.courseId;
    rec.summary = String(fields.summary || '').trim();
    rec.description = String(fields.description || '').trim();
    rec.updatedAt = new Date().toISOString();
    pushContentEvent(rec, 'metadata', 'Canonical metadata updated', actor, rec.updatedAt, '');
    save();
    return rec;
  }

  /* ---------- CONTENT MANAGER: DELIVERY LINK MANAGEMENT (07.3) ----------
     The stakeholder was explicit: *"content manager should have the
     provision to edit the link ... if he wants to delete and replace the
     link also he can replace it"*, because the Content Manager is the one
     managing the content.

     ── WHAT THIS DELIBERATELY DOES NOT DO ────────────────────────
     It touches ONLY the delivery detail of a technology the record
     already carries. It cannot add or remove a TECHNOLOGY — that is the
     Vendor's technical submission and widening it here would hand an
     institution a technology nobody reviewed. It cannot touch Learning
     Outcomes (Academic Reviewer's) or the version/revision counters, so
     version history semantics are untouched.

     Every edit requires a REASON and writes a history entry naming the
     technology, what it was and what it became. Nothing is silent.

     The Academic Reviewer is deliberately NOT given this authority: they
     must be able to OPEN and inspect a link during review, which is a
     read, and no confirmed source grants them delivery-edit rights. */
  var MANAGER_DELIVERY_FIELDS = ['url', 'packageRef', 'packageLabel', 'runtime', 'notes'];
  /* ⚠ EVERYTHING A REMOVAL MUST CLEAR — 07.3 adversarial fix.
     `remove` cleared only the writable set above, so the Vendor-authored
     `packageFile` and `install` survived. `publishReadiness` then still
     saw package information and never raised its blocker, and
     `deliveryRows` still printed "Selected file: rig-12.apk" — while the
     removal dialog promised that everything recorded for that technology
     was cleared. The writable set stays narrower than this on purpose:
     the Content Manager corrects references, and does not author the
     Vendor's package. */
  var DELIVERY_ALL_FIELDS = MANAGER_DELIVERY_FIELDS.concat(['packageFile', 'install']);

  function managerCanEditDelivery(rec, actorId) {
    /* Library-wide: the Content Manager manages the repository, which
       includes a published record whose hosted link has gone stale —
       the stakeholder's own example. Authority is scope, not status. */
    return managerCanAct(rec, actorId);
  }

  /* Every field `managerUpdateDelivery` can write, in a stable order.
     Used ONLY to decide whether anything actually moved. */
  function deliveryFingerprint(rec, tech) {
    var d = deliveryOf(rec, tech);
    return DELIVERY_ALL_FIELDS.map(function (k) {
      return k + '=' + String(d[k] === undefined || d[k] === null ? '' : d[k]);
    }).join('\u0001');
  }

  function deliverySummaryFor(rec, tech) {
    var d = deliveryOf(rec, tech);
    var def = data.TECHNOLOGIES[tech];
    if (def && def.delivery === 'hosted') { return String(d.url || ''); }
    return String(d.packageRef || d.packageLabel || '');
  }

  /* patch: { url?, packageRef?, packageLabel?, runtime?, notes? }
     `remove` clears the delivery reference for that technology instead.
     Returns null when refused, so the screen never claims a write. */
  function managerUpdateDelivery(actorId, recordId, tech, patch, reason, remove) {
    var rec = contentRecord(recordId);
    var actor = contentActor(actorId);
    if (!rec || !managerCanEditDelivery(rec, actorId)) { return null; }
    if (rec.technologies.indexOf(tech) === -1) { return null; }
    var why = String(reason || '').trim();
    if (!why) { return null; }

    var def = data.TECHNOLOGIES[tech] || {};
    var before = deliverySummaryFor(rec, tech);
    /* Field-by-field, captured BEFORE the mutation, so the audit entry can
       name what actually moved instead of restating an unchanged summary. */
    var beforeFields = {};
    DELIVERY_ALL_FIELDS.forEach(function (k) {
      var dv = deliveryOf(rec, tech)[k];
      beforeFields[k] = dv === undefined || dv === null ? '' : String(dv);
    });
    /* ⚠ THE SUMMARY IS NOT THE RECORD — 07.3 adversarial fix.

       The no-op guard below originally compared `deliverySummaryFor()`
       alone, which reads only the URL (hosted) or the package reference
       (package). An edit that touched ONLY `runtime`, `notes`, or
       `packageLabel` beside a non-empty `packageRef` left that summary
       identical, so the guard fired: the in-memory record had already
       been mutated, no history was written, `save()` was never reached
       — and the function still returned the record, which every caller
       reads as success. The edit was announced, not recorded, and lost
       on reload (or flushed later by an unrelated `save()`, landing in
       storage with no audit entry at all).

       The fingerprint therefore covers every field this writer can
       actually change. */
    var beforePrint = deliveryFingerprint(rec, tech);
    if (!rec.delivery || typeof rec.delivery !== 'object') { rec.delivery = {}; }
    var d = rec.delivery[tech] && typeof rec.delivery[tech] === 'object'
      ? rec.delivery[tech] : {};

    if (remove) {
      DELIVERY_ALL_FIELDS.forEach(function (k) { delete d[k]; });
    } else {
      var p = patch || {};
      if (def.delivery === 'hosted') {
        var url = String(p.url === undefined ? (d.url || '') : p.url).trim();
        /* A hosted link that is not a URL is refused rather than stored:
           the Student would be handed something that cannot open. */
        if (url && !isHttpUrl(url)) { return null; }
        d.url = url;
      } else {
        if (p.packageRef !== undefined) { d.packageRef = String(p.packageRef || '').trim(); }
        if (p.packageLabel !== undefined) { d.packageLabel = String(p.packageLabel || '').trim(); }
      }
      if (p.runtime !== undefined) { d.runtime = String(p.runtime || '').trim(); }
      if (p.notes !== undefined) { d.notes = String(p.notes || '').trim(); }
    }
    rec.delivery[tech] = d;

    var after = deliverySummaryFor(rec, tech);
    if (deliveryFingerprint(rec, tech) === beforePrint && !remove) {
      /* Nothing actually moved. Writing a history entry for a no-op
         would make the audit trail lie about how often this changed.
         Compared across EVERY editable field — see the note above. */
      return rec;
    }
    /* ⚠ THE NOTE MUST NAME WHAT MOVED — 07.3 adversarial fix.
       This recorded `deliverySummaryFor` before and after, which reads
       ONLY the URL or the package reference. A notes-only, runtime-only or
       label-only edit therefore logged "was: PKG-1 · now: PKG-1" and the
       prior value was unrecoverable — while three places on the screen
       promised the history would name what it was and what it became. */
    var moved = [];
    DELIVERY_ALL_FIELDS.forEach(function (k) {
      var av = deliveryOf(rec, tech)[k];
      var after1 = av === undefined || av === null ? '' : String(av);
      if (after1 !== beforeFields[k]) {
        moved.push(k + ': "' + (beforeFields[k] || '(none)') + '" → "' + (after1 || '(none)') + '"');
      }
    });
    var now = new Date().toISOString();
    rec.updatedAt = now;
    pushContentEvent(rec, 'delivery',
      (remove ? 'Delivery reference removed — ' : 'Delivery reference updated — ') +
        (def.label || tech),
      actor, now,
      why + ' · ' + (moved.length ? moved.join(' · ')
        : 'was: ' + (before || '(none)') + ' · now: ' + (after || '(none)')));
    save();
    return rec;
  }

  /* PM-14's return path at the content readiness gate — WITH AN EXPLICIT
     DESTINATION (07.3).

     The stakeholder was precise about this: *"if you click the request,
     there should be 2 options available. One is academic reviewer and one
     is vendor."* An academic/content problem is the Academic Reviewer's
     to resolve; a technical one — the app not working, a bad package, a
     broken hosted link, a delivery discrepancy — is the Vendor's. Sending
     a broken link back through academic review was the specific thing the
     stakeholder called pointless.

     The destination is a REAL state fork, not a label: each one writes a
     different status whose `holder` is a different role, so the record
     genuinely lands in that recipient's queue.

     `destination` defaults to the Vendor, which is what this function did
     before the split — so every existing caller keeps its behaviour. */
  var CHANGE_DESTINATION = { VENDOR: 'vendor', REVIEWER: 'reviewer' };

  function requestChangesContent(actorId, recordId, comment, opts) {
    var rec = contentRecord(recordId);
    var actor = contentActor(actorId);
    if (!managerCanAct(rec, actorId)) { return null; }
    if (rec.status !== CONTENT_STATUS.CONTENT_REVIEW) { return null; }
    var text = String(comment || '').trim();
    if (!text) { return null; }
    var o = opts || {};
    var dest = o.destination === CHANGE_DESTINATION.REVIEWER
      ? CHANGE_DESTINATION.REVIEWER : CHANGE_DESTINATION.VENDOR;
    var refList = normalizeContentRefs(o.refs);
    var now = new Date().toISOString();

    if (dest === CHANGE_DESTINATION.REVIEWER) {
      /* ACADEMIC ROUTE. The record goes to the Academic Reviewer, whose
         `holder` is `reviewer`, and `returnedGate` is deliberately NOT
         touched: the Vendor has not been asked for anything, so the gate
         that governs a Vendor resubmission still describes the last time
         the Vendor was actually involved. */
      rec.status = CONTENT_STATUS.CHANGES_ACADEMIC_RECHECK;
      rec.updatedAt = now;
      pushContentEvent(rec, 'changes',
        'Returned to the Academic Reviewer — academic / content issue', actor, now, text, refList);
    } else {
      rec.status = CONTENT_STATUS.CHANGES_CONTENT;
      rec.returnedGate = 'content';
      rec.resubmitted = false;
      rec.updatedAt = now;
      pushContentEvent(rec, 'changes',
        'Returned to the Vendor — technical / delivery issue', actor, now, text, refList);
    }
    save();
    return rec;
  }

  /* FIRST PUBLICATION (STK31-06). The word is PUBLISH.
     Release / Hold is the Super Admin's action on a LATER VERSION of an
     already-published Experiment (STK31-07) and is not implemented in
     this slice.

     This writes exactly one thing beyond the publication record: the
     content record's status. It creates no tenant access, changes no
     licence and assigns nothing to a student — PUBLISHED, TENANT ACCESS
     and STUDENT ENTITLEMENT stay three different altitudes. */
  function publishContent(actorId, recordId) {
    var rec = contentRecord(recordId);
    var actor = contentActor(actorId);
    if (!managerCanAct(rec, actorId)) { return null; }
    if (!publishReadiness(rec).ok) { return null; }
    var now = new Date().toISOString();
    S.seq.publication += 1;
    var pub = {
      id: 'PUB-' + util.pad3(S.seq.publication),
      recordId: rec.id,
      publishedBy: actorId,
      publishedByName: actor.name,
      publishedAt: now,
      versionLabel: rec.versionLabel,
      revision: rec.revision,
      technologies: rec.technologies.slice(),
      outcomes: rec.outcomes.slice(),
      academicReviewId: rec.academicReview ? rec.academicReview.id : null,
      academicReviewerName: rec.academicReview ? rec.academicReview.reviewerName : null,
      origin: 'workflow'
    };
    S.publicationRecords.push(pub);
    rec.publication = JSON.parse(JSON.stringify(pub));
    rec.status = CONTENT_STATUS.PUBLISHED;
    rec.updatedAt = now;
    pushContentEvent(rec, 'published', 'Published to the catalogue (v' + rec.revision + ')', actor, now, '');
    save();
    return rec;
  }

  /* ---------- workspace summaries (real state only) ---------- */

  function vendorOverview(actorId) {
    var mine = contentForVendor(actorId);
    function n(status) { return mine.filter(function (r) { return r.status === status; }).length; }
    return {
      total: mine.length,
      draft: n(CONTENT_STATUS.DRAFT),
      inAcademicReview: n(CONTENT_STATUS.ACADEMIC_REVIEW),
      changesRequested: n(CONTENT_STATUS.CHANGES_ACADEMIC) + n(CONTENT_STATUS.CHANGES_CONTENT),
      awaitingPublication: n(CONTENT_STATUS.CONTENT_REVIEW),
      published: n(CONTENT_STATUS.PUBLISHED),
      returned: mine.filter(function (r) {
        return r.status === CONTENT_STATUS.CHANGES_ACADEMIC || r.status === CONTENT_STATUS.CHANGES_CONTENT;
      }),
      incompleteDrafts: mine.filter(function (r) {
        return r.status === CONTENT_STATUS.DRAFT && validateContent(r, 'submit', { exceptId: r.id }).length > 0;
      }),
      readyDrafts: mine.filter(function (r) {
        return r.status === CONTENT_STATUS.DRAFT && validateContent(r, 'submit', { exceptId: r.id }).length === 0;
      }),
      recentlyPublished: mine.filter(function (r) { return r.status === CONTENT_STATUS.PUBLISHED; })
    };
  }

  function reviewerOverview(actorId) {
    var scope = contentForReviewer(actorId);
    function n(status) { return scope.filter(function (r) { return r.status === status; }).length; }
    var decisions = academicReviewsBy(actorId);
    return {
      waiting: n(CONTENT_STATUS.ACADEMIC_REVIEW) + n(CONTENT_STATUS.CHANGES_ACADEMIC_RECHECK),
      /* 07.3 — a Content-Manager academic return sits in the SAME queue
         as a fresh submission: both are work this reviewer must decide. */
      returnedByManager: n(CONTENT_STATUS.CHANGES_ACADEMIC_RECHECK),
      queue: scope.filter(function (r) {
        return r.status === CONTENT_STATUS.ACADEMIC_REVIEW ||
               r.status === CONTENT_STATUS.CHANGES_ACADEMIC_RECHECK; }),
      changesRequested: n(CONTENT_STATUS.CHANGES_ACADEMIC),
      approvedAwaitingPublication: n(CONTENT_STATUS.CONTENT_REVIEW),
      published: n(CONTENT_STATUS.PUBLISHED),
      decisions: decisions,
      recent: decisions.slice(0, 5),
      courses: actorCourseIds(actorId)
    };
  }

  function managerOverview(actorId) {
    var scope = contentForManager(actorId);
    function n(status) { return scope.filter(function (r) { return r.status === status; }).length; }
    var queue = scope.filter(function (r) { return r.status === CONTENT_STATUS.CONTENT_REVIEW; });
    var techCover = {};
    scope.filter(function (r) { return r.status === CONTENT_STATUS.PUBLISHED; })
      .forEach(function (r) {
        r.technologies.forEach(function (t) { techCover[t] = (techCover[t] || 0) + 1; });
      });
    return {
      published: n(CONTENT_STATUS.PUBLISHED),
      awaitingPublication: queue.length,
      queue: queue,
      inPipeline: scope.length - n(CONTENT_STATUS.PUBLISHED),
      inAcademicReview: n(CONTENT_STATUS.ACADEMIC_REVIEW),
      withVendor: n(CONTENT_STATUS.DRAFT) + n(CONTENT_STATUS.CHANGES_ACADEMIC) + n(CONTENT_STATUS.CHANGES_CONTENT),
      /* 07.3 — returned by THIS role to the Academic Reviewer. Held by
         the reviewer, so it is deliberately NOT counted in withVendor. */
      returnedToReviewer: n(CONTENT_STATUS.CHANGES_ACADEMIC_RECHECK),
      inAcademicRecheck: n(CONTENT_STATUS.CHANGES_ACADEMIC_RECHECK),
      technologyCoverage: data.TECH_ORDER.filter(function (t) { return techCover[t]; })
        .map(function (t) { return { tech: t, count: techCover[t] }; }),
      blockedInQueue: queue.filter(function (r) { return !publishReadiness(r).ok; })
    };
  }

  /* SCHEMA 5 → 6: content production.

     Additive and non-destructive. An Implementation-01…04 browser state
     gains the canonical content pool, the prototype content actors and
     their scope, and the sample in-flight pipeline. NOTHING already
     stored is touched: requests, tenants, access, people, groups,
     memberships, academic and Faculty mappings, student assignments,
     resource and simulation activity, attempts, the Question Bank,
     assessment definitions and their revisions, and descriptive reviews
     all survive exactly as they were. Reset remains the only
     destructive operation.

     The existing published catalogue migrates as PUBLISHED content
     carrying a publication record whose origin is `seed` — it is NOT
     replayed through a fabricated Vendor → Reviewer → Manager history,
     because inventing decisions nobody made would be a lie in the audit
     trail. Experiment ids are unchanged, so every stored reference to
     them — selection items, access rows, assignments, faculty mappings,
     attempts, questions, reviews — still resolves. */
  function migrateContentProduction(parsed, storedVersion) {
    if (!Array.isArray(parsed.contentRecords)) { parsed.contentRecords = []; }
    if (!Array.isArray(parsed.academicReviews)) { parsed.academicReviews = []; }
    if (!Array.isArray(parsed.publicationRecords)) { parsed.publicationRecords = []; }
    if (!Array.isArray(parsed.contentActors)) { parsed.contentActors = []; }
    if (!Array.isArray(parsed.contentRoleAssignments)) { parsed.contentRoleAssignments = []; }

    contentSeeding = true;
    try {
      if (!parsed.contentActors.length) { seedContentActors(parsed); }
      /* Back-fill the canonical pool from the seed catalogue. Any seed
         Experiment that has no content record yet becomes one; an
         Experiment the workflow already produced is left alone. */
      var known = {};
      parsed.contentRecords.forEach(function (r) { known[r.id] = true; });
      var missing = data.EXPERIMENTS.filter(function (e) { return !known[e.id]; });
      if (missing.length) {
        var stamp = parsed.seededAt || new Date().toISOString();
        missing.forEach(function (e) {
          parsed.seq.contentRec += 1;
          parsed.seq.contentEvent += 1;
          parsed.seq.publication += 1;
          var rec = newContentRecord({
            id: e.id, courseId: e.courseId, name: e.name, summary: e.summary,
            description: e.description, outcomes: e.outcomes, technologies: e.technologies,
            delivery: seedDeliveryFor(e.technologies), versionLabel: '1.0', revision: 1,
            status: CONTENT_STATUS.PUBLISHED, origin: 'seed',
            createdAt: stamp, updatedAt: stamp
          });
          rec.eventSeq = parsed.seq.contentEvent;
          rec.publication = {
            id: 'PUB-' + util.pad3(parsed.seq.publication), recordId: rec.id,
            publishedBy: null, publishedByName: 'Existing published content (prototype seed)',
            publishedAt: stamp, versionLabel: '1.0', revision: 1,
            technologies: e.technologies.slice(), outcomes: e.outcomes.slice(), origin: 'seed'
          };
          rec.history = [{
            seq: parsed.seq.contentEvent, kind: 'seeded',
            label: 'Existing published catalogue content',
            actorName: null, actorRole: null, at: stamp,
            note: 'Present in the published catalogue before the content production workflow was integrated.'
          }];
          parsed.contentRecords.push(rec);
          parsed.publicationRecords.push(JSON.parse(JSON.stringify(rec.publication)));
        });
      }
      /* The sample in-flight pipeline is seeded once, and only into a
         state that has never held any workflow-produced content — so a
         browser that already drove content through the chain is never
         given records it did not create. */
      if (storedVersion < 6 && !parsed.contentRecords.some(function (r) { return r.origin === 'vendor'; })) {
        seedContentPipeline(parsed);
      }
    } finally {
      contentSeeding = false;
      pubCache = null;
      pubCacheSeq = -1;
    }

    /* Back-fill the academic fingerprint onto approvals written before it
       existed. It is computed from the record AS IT STANDS, which is the
       only honest reading: nothing has been resubmitted since, so the
       approval and the content are still the pair the reviewer saw. */
    parsed.contentRecords.forEach(function (rec) {
      if (rec.academicReview && typeof rec.academicReview.fingerprint !== 'string') {
        rec.academicReview.fingerprint = academicFingerprint(rec);
      }
    });
    parsed.academicReviews.forEach(function (r) {
      if (r.decision === 'approved' && typeof r.fingerprint !== 'string') {
        var rec = parsed.contentRecords.filter(function (c) { return c.id === r.recordId; })[0];
        if (rec) { r.fingerprint = academicFingerprint(rec); }
      }
    });

    /* A stale prototype pointer must never resolve to a fabricated
       identity, and must never resolve to an actor of the wrong role. */
    ['protoVendorId', 'protoReviewerId', 'protoManagerId'].forEach(function (key, i) {
      var role = ['vendor', 'reviewer', 'manager'][i];
      if (typeof parsed[key] !== 'string') { parsed[key] = null; return; }
      var ok = parsed.contentActors.some(function (a) { return a.id === parsed[key] && a.role === role; });
      if (!ok) { parsed[key] = null; }
    });
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
  pubCache = null;
  pubCacheSeq = -1;
  /* Runs against live state, so it can use the real entitlement engine.
     A no-op for a state that has nothing to repair. */
  resolveTransferScopes();

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); }
    catch (e) { /* storage unavailable — prototype continues in memory */ }
  }

  function reset() {
    S = initialState();
    pubCache = null;
    pubCacheSeq = -1;
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

  /* WHICH INSTITUTION THE PUBLIC PLANE IS CURRENTLY SPEAKING FOR.

     ⚠ PROTOTYPE-ONLY, AND NOT AUTHENTICATION. The public catalogue is
     deliberately browse-before-login and there is no sign-in anywhere in
     this build. This resolves the requester from the PROTOTYPE SCENARIO
     SELECTOR and nothing else, which is the same two-step lookup
     `resolveRequestTenant` already performs once a request exists —
     seeded tenant first, then an exact name match. It returns null
     whenever the scenario names no institution that has been
     provisioned yet (Scenario B before its first approval), and every
     surface that reads it must render nothing in that case rather than
     claim an identity the build cannot establish.

     It grants NOTHING. It is used only to SHOW an institution what it
     already holds while it is choosing (Implementation 07.2, rule A). */
  /* THE INSTITUTION THE REQUESTER IS ACTUALLY TYPING.

     `scenarioTenant()` answers "who is browsing", which is the only
     question the anonymous catalogue can ask. The REQUEST FORM can do
     better: the applicant types an institution name, and that name —
     not the scenario's default — is who the request will be matched to
     at approval (`resolveRequestTenant` resolves `tenantByName` on
     exactly this value).

     Reading the scenario there instead showed one institution's access
     records, licence counts and terms to somebody requesting under a
     different name. The match is exact, trimmed and case-insensitive,
     and an unrecognised name resolves to null rather than to whichever
     institution the prototype selector happens to be pointing at. */
  function requesterTenant(name) {
    var n = String(name == null ? '' : name).trim();
    if (n) { return tenantByName(n); }
    return scenarioTenant();
  }
  function scenarioTenant() {
    var sc = scenario();
    if (sc.seedTenantId) {
      var seeded = tenantById(sc.seedTenantId);
      if (seeded) { return seeded; }
    }
    return tenantByName(sc.institution.name) || null;
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

    /* ⚠ AN EXISTING INSTITUTION KEEPS ITS OWN COMMERCIAL ROUTE — 07.3
       adversarial fix.

       Identity already comes from the typed name (`resolveRequestTenant`),
       but `kind` / `accessContext` / `paymentRequired` were still taken
       unconditionally from the prototype SCENARIO SELECTOR. The two halves
       therefore disagreed: typing an existing institution's name while the
       other scenario happened to be selected produced a request bound to
       that institution but carrying the WRONG route — a BITS Community
       institution sent through a payment step and given a record stamped
       `Subscription`, or a paid institution handed a free record.

       `submitRenewalRequest` already calls reading `scenario()` here "a
       live defect" and derives its route from the institution. An
       ordinary second request — which is exactly what clarification A
       invites — never got the same treatment.

       The scenario is now consulted ONLY for a name the platform does not
       recognise, which is the one case where there is no institution to
       ask. */
    var known = requesterTenant(form.institutionName);
    var knownOrigin = known ? originRequestFor(known.id) : null;
    var route = known
      ? {
          kind: known.kind,
          accessContext: known.accessContext,
          paymentRequired: knownOrigin ? !!knownOrigin.paymentRequired : known.kind === 'external'
        }
      : {
          kind: sc.institution.kind,
          accessContext: sc.institution.accessContext,
          paymentRequired: sc.institution.paymentRequired
        };

    S.seq.request += 1;
    var now = new Date().toISOString();
    var req = {
      id: 'REQ-' + util.pad3(S.seq.request),
      scenarioId: sc.id,
      institution: {
        name: form.institutionName,
        kind: route.kind,
        accessContext: route.accessContext,
        contactName: form.contactName,
        contactEmail: form.contactEmail
      },
      paymentRequired: route.paymentRequired,
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

  /* ============================================================
     THE SUPER ADMIN DECISION SURFACE — `STK31-20` / `U-SA-05`

       "SUPER ADMIN review / approval — approve · request more
        information · REASON REQUIRED · HISTORY TRAIL"

     and the granting end of `STK31-24` / `STK31-21` / `U-SA-08`:

       "Super Admin controls which Courses, Experiments and technology
        variants are available to a Tenant."

     Both halves live here, because they are one decision. Approving a
     request is the ONLY thing that creates a `TenantContentAccess`
     record, so the moment of approval is the only moment at which the
     Super Admin can decide what the tenant actually receives.

     THE GRANT MAY ONLY NARROW WHAT WAS ASKED FOR. The Super Admin
     removes Experiments, removes technology variants, and lowers the
     quantity or the term. It cannot ADD any of them: nothing in the
     sources lets the platform hand an institution content it never
     requested, and a wider grant would have to come from a new request.
     Omitting the grant approves the request exactly as submitted, which
     is what every earlier build did.

     ⚠ Approval still creates NO student entitlement (STK31-25).
     ============================================================ */

  /* Why a decision cannot be taken on this request right now, or null. */
  function requestDecisionBlock(req) {
    if (!req) { return 'missing'; }
    if (req.status !== STATUS.SUBMITTED) { return 'not-open'; }
    /* A deactivated institution cannot be activated INTO. Approval would
       write an access record the tenant cannot use, under a dialog that
       promises activation — a contradictory business state (STK31-21 /
       STK31-22). Reactivate first, then decide. */
    var target = resolveRequestTenant(req);
    if (target && !tenantIsActive(target.id)) { return 'tenant-inactive'; }
    return null;
  }
  function requestCanBeDecided(req) { return requestDecisionBlock(req) === null; }

  /* Which existing tenant this request belongs to, if any.
     Extracted so the decision can ask the question BEFORE it commits.

     `req.tenantId` wins once the institution has been provisioned: from
     that moment the request is bound to a specific institution, and the
     name it was submitted under stops being the identity. Without that,
     a later rename would have made payment resolve somewhere else. */
  function resolveRequestTenant(req) {
    if (req.tenantId) {
      var bound = tenantById(req.tenantId);
      if (bound) { return bound; }
    }
    /* ⚠ THE SUBMITTED NAME OUTRANKS THE PROTOTYPE SCENARIO — 07.3
       adversarial fix.

       This previously consulted `SCENARIOS[req.scenarioId].seedTenantId`
       FIRST and fell back to the name. That made the prototype's own
       selector, not the applicant, decide who a request belonged to: a
       request typed under a name no institution on the platform matches
       still resolved to whichever institution the scenario seeded.

       On the Super Admin request screen that was a cross-institution
       disclosure on the one card whose job is to answer "does THIS
       requester already hold it": the "Already held by this institution"
       card rendered a STRANGER's access-record ids, technologies, terms
       and licence figures, and the identity sentence asserted the
       request attached to an institution that had not submitted it.

       `requesterTenant()` above already had exactly this fix for the
       public request form and documents the same reasoning. The two read
       models now agree: an unrecognised name resolves to NULL — which is
       the truth, and which the screen already renders as "approving
       creates a NEW institution" — rather than to a bystander.

       The scenario seed is still consulted, but only where it cannot
       misattribute anything: when the request carries no institution
       name at all. */
    var typed = req.institution && req.institution.name;
    if (String(typed == null ? '' : typed).trim()) {
      return tenantByName(typed) || null;
    }
    var sc = XRSLP.data.SCENARIOS[req.scenarioId];
    if (sc && sc.seedTenantId) { return tenantById(sc.seedTenantId) || null; }
    return null;
  }

  var TERM_ORDER = ['monthly', 'quarterly', 'yearly'];

  /* Validates a proposed grant against the request. Returns
     { ok, errors[], grant } — `grant` is null when the decision is to
     approve the request exactly as submitted. */
  function validateGrant(req, grant) {
    var errs = [];
    if (!grant) { return { ok: true, errors: [], grant: null }; }
    var items = [], seenExp = {};
    (grant.items || []).forEach(function (g) {
      var asked = req.items.filter(function (i) { return i.experimentId === g.experimentId; })[0];
      if (!asked) { errs.push({ field: 'grant-items', message: 'That experiment is not part of this request.' }); return; }
      /* One entry per experiment. Two entries for the same experiment
         would let the second silently overwrite the first's
         technologies while `grantNarrowsRequest` compared only the
         count and reported nothing unusual. */
      if (seenExp[g.experimentId]) {
        errs.push({ field: 'grant-items', message: 'The same experiment appears twice in this allocation.' });
        return;
      }
      seenExp[g.experimentId] = true;
      var techs = [], dup = false;
      (g.technologies || []).forEach(function (t) {
        if (asked.technologies.indexOf(t) === -1) { return; }
        if (techs.indexOf(t) !== -1) { dup = true; return; }
        techs.push(t);
      });
      if (dup) {
        errs.push({ field: 'grant-items', message: 'A technology appears twice for the same experiment.' });
        return;
      }
      if ((g.technologies || []).length !== techs.length) {
        errs.push({ field: 'grant-items', message: 'A technology was granted that the institution did not request.' });
        return;
      }
      if (techs.length) { items.push({ experimentId: g.experimentId, technologies: techs }); }
    });
    if (!items.length) {
      errs.push({ field: 'grant-items', message: 'Grant at least one experiment with at least one technology.' });
    }
    var qty = grant.quantity === undefined || grant.quantity === null || grant.quantity === ''
      ? req.quantity : Number(grant.quantity);
    if (!(qty > 0) || Math.round(qty) !== qty) {
      errs.push({ field: 'grant-quantity', message: 'Enter a whole number of users greater than zero.' });
    } else if (qty > req.quantity) {
      errs.push({ field: 'grant-quantity', message: 'The approved quantity cannot exceed the ' + req.quantity + ' requested.' });
    }
    var term = grant.term || req.term;
    if (!XRSLP.data.term(term)) {
      errs.push({ field: 'grant-term', message: 'Choose an access term.' });
    } else if (TERM_ORDER.indexOf(term) > TERM_ORDER.indexOf(req.term)) {
      errs.push({ field: 'grant-term', message: 'The approved term cannot be longer than the term requested.' });
    }
    if (errs.length) { return { ok: false, errors: errs, grant: null }; }
    return { ok: true, errors: [], grant: { items: items, quantity: qty, term: term } };
  }

  /* True when the grant differs from what was asked for — the screens
     use this to say so plainly on both sides. */
  function grantNarrowsRequest(req) {
    var g = req && req.grant;
    if (!g) { return false; }
    if (g.quantity !== req.quantity || g.term !== req.term) { return true; }
    if (g.items.length !== req.items.length) { return true; }
    return req.items.some(function (i) {
      var got = g.items.filter(function (x) { return x.experimentId === i.experimentId; })[0];
      return !got || got.technologies.length !== i.technologies.length;
    });
  }

  /* ---------- approval + activation consequences ---------- */

  function approveRequest(id, decision) {
    var req = request(id);
    if (!req) { return null; }
    if (!requestCanBeDecided(req)) { return null; }
    decision = decision || {};
    /* A RENEWAL CANNOT BE NARROWED — Implementation 07.2, adversarial fix.

       The grant editor exists because the Super Admin may hand an
       institution LESS than it asked for. A renewal is a different
       object: it mirrors a plan that already exists, and whether a
       renewal may change licences, technologies or term is an OPEN
       question this build must not answer by accident.

       Without this guard the two halves disagreed silently and
       dangerously: `validateGrant` accepted a narrowing, the decision
       dialog and the institution's own status screen both announced
       "the institution receives less than it requested", and then
       `activateRenewal` — which extends the term of an EXISTING record
       rather than writing a new one — applied only the term and left
       the licences, experiments and technologies exactly as they were.
       The recorded decision and the real entitlement diverged with
       nothing to reconcile them.

       Refusing here is the fail-safe reading: to give an institution
       something different from what it holds, raise an ordinary
       institutional request. */
    if (req.renewsAccessId && decision.grant) { return null; }
    /* REASON REQUIRED — STK31-20. The applicant reads it on their own
       status screen, so it is a product value, not an audit nicety. */
    var reason = String(decision.reason || '').trim();
    if (!reason) { return null; }
    var g = validateGrant(req, decision.grant || null);
    if (!g.ok) { return null; }
    var now = new Date().toISOString();
    req.grant = g.grant;
    req.decisionReason = reason;
    req.approvedAt = now;
    var narrowed = grantNarrowsRequest(req);
    if (req.paymentRequired) {
      req.status = STATUS.APPROVED_PAYMENT_REQUIRED;
      req.history.push({ at: now, who: 'Super Admin', note: reason,
        event: 'Approved — payment required before activation' + (narrowed ? ' (allocation adjusted)' : '') });
      /* APPROVAL AUTHORISES THE INSTITUTION; PAYMENT ACTIVATES ITS
         ACCESS. `STK31-21` makes creating the tenant and assigning its
         Tenant Admin Super Admin acts distinct from — and listed before
         — deciding what content it receives, and `17/06 §3.3` puts only
         the allocation, quantity and term inside step ⑨. So the
         institution exists from here on BOTH routes; what the external
         route still lacks is its access record, which is exactly what
         "payment required" means. It receives no content, no licence and
         no entitlement until payment succeeds. */
      provisionTenantFor(req, now);
    } else {
      req.status = STATUS.ACTIVE;
      req.history.push({ at: now, who: 'Super Admin', note: reason,
        event: 'Approved' + (narrowed ? ' (allocation adjusted)' : '') });
      /* Internal / BITS Community: no payment step exists on this route
         at all (`STK31-19`), so approval provisions AND activates in one
         moment, exactly as it always has. */
      activateRequest(req, now);
    }
    save();
    return req;
  }

  /* STK31-20's second outcome. It refuses nothing and grants nothing:
     the request goes back to the applicant with a reason, and returns to
     the queue unchanged when they resubmit. */
  function requestMoreInformation(id, reason) {
    var req = request(id);
    if (!req || !requestCanBeDecided(req)) { return null; }
    var note = String(reason || '').trim();
    if (!note) { return null; }
    var now = new Date().toISOString();
    req.status = STATUS.INFO_REQUESTED;
    req.decisionReason = note;
    req.history.push({ at: now, event: 'More information requested', who: 'Super Admin', note: note });
    save();
    return req;
  }

  /* The applicant's side of that outcome. */
  function resubmitRequest(id, note) {
    var req = request(id);
    if (!req || req.status !== STATUS.INFO_REQUESTED) { return null; }
    var text = String(note || '').trim();
    if (!text) { return null; }
    var now = new Date().toISOString();
    req.status = STATUS.SUBMITTED;
    req.decisionReason = null;
    req.history.push({ at: now, event: 'Resubmitted with more information', who: req.institution.name, note: text });
    save();
    return req;
  }

  /* ---------- the payment step, provider-neutral — `ND-12` / `U-COM-03`
     "keep the payment step PROVIDER-NEUTRAL with ALL THREE FRD 9.1.x
      OUTCOMES — SUCCESS · DECLINED · INDETERMINATE — and ONLY SUCCESS
      WRITES."

     There is no gateway, no provider and no money (STK31-19). What the
     three outcomes model is the STATE THE INSTITUTION IS LEFT IN, which
     is a real product question: a declined attempt leaves the request
     exactly where it was and says so; an indeterminate one leaves it
     where it was and says the platform does not yet know. Only SUCCESS
     activates. Nothing else in the build changes in any of the three. */
  var PAYMENT_OUTCOME = { SUCCESS: 'success', DECLINED: 'declined', INDETERMINATE: 'indeterminate' };

  function completePayment(id, outcome) {
    var req = request(id);
    if (!req || req.status !== STATUS.APPROVED_PAYMENT_REQUIRED) { return null; }
    outcome = outcome || PAYMENT_OUTCOME.SUCCESS;
    /* THE SAME TENANT GATE THE DECISION MEETS. Approval refuses to
       activate onto a deactivated institution — but on the external
       route approval and activation are two separate moments, and an
       institution can be deactivated in between. Without this, payment
       walked straight past the guard and activated access the tenant
       could not use, under a screen promising it could. Only the
       WRITING outcome is gated: recording that a payment was declined
       or unconfirmed changes nothing and stays available. */
    if (outcome === PAYMENT_OUTCOME.SUCCESS) {
      var target = resolveRequestTenant(req);
      if (target && !tenantIsActive(target.id)) { return null; }
    }
    var now = new Date().toISOString();
    if (outcome === PAYMENT_OUTCOME.DECLINED) {
      req.paymentOutcome = outcome;
      req.history.push({ at: now, who: req.institution.name,
        event: 'Payment declined (prototype simulation) — nothing was activated' });
      save();
      return req;
    }
    if (outcome === PAYMENT_OUTCOME.INDETERMINATE) {
      req.paymentOutcome = outcome;
      req.history.push({ at: now, who: req.institution.name,
        event: 'Payment outcome not confirmed (prototype simulation) — nothing was activated' });
      save();
      return req;
    }
    if (outcome !== PAYMENT_OUTCOME.SUCCESS) { return null; }
    req.paymentOutcome = outcome;
    req.history.push({ at: now, event: 'Payment completion simulated (prototype only)', who: req.institution.name });
    req.status = STATUS.ACTIVE;
    activateRequest(req, now);
    save();
    return req;
  }

  /* ============================================================
     PROVISIONING THE INSTITUTION — a DIFFERENT transition from
     activating its access, and the two must not be one function.

       `STK31-21` lists the Super Admin's acts in order and as separate
       capabilities: *reviews the application · approves / authorises the
       tenant · **creates and governs the tenant** · **assigns the Tenant
       / Institute Admin** · … · **decides which content and technologies
       the tenant receives**.*

       `17/07 §2`'s actor table carries the same three as separate
       confirmed stages, in that order — Create the tenant, Assign the
       Tenant Admin, Allocate content and technologies — and `17/06 §3.3`
       shows what payment actually gates: step ⑨ **TENANT ACCESS
       ACTIVATION**, whose contents are the allocated Courses,
       Experiments and technologies, the licence quantity and the access
       term. The institution itself is not in that step.

       The confirmed constraint is stated precisely: *"🔴 **ACCESS** is
       NEVER granted before approval"* — a rule about access, not about
       whether the institution exists.

     So APPROVAL provisions the institution, on both routes. PAYMENT
     gates only the access record. Merging the two meant an approved
     external institution did not exist anywhere until it paid — the
     Super Admin could not assign its Tenant Admin (`STK31-21`), the
     Institutions list contradicted the decision screen, and tenant
     EXISTENCE was silently conflated with tenant CONTENT ACCESS.

     ⚠ PROVISIONING GRANTS NOTHING. A provisioned institution holds no
     access record, so it has no assignable content, no licence
     allocation, no Faculty reach and no student entitlement — every one
     of those derives from `access[]`, which only activation writes.
     `status: 'active'` is the DEACTIVATION axis (`STK31-22`) and means
     only "not deactivated by the Super Admin"; it has never meant, and
     does not mean here, that the tenant holds anything. Marking a
     brand-new institution `inactive` would have been the actual lie —
     it would claim the Super Admin had deactivated it. */
  function provisionTenantFor(req, nowIso) {
    var tenant = resolveRequestTenant(req);
    if (!tenant) {
      /* THE IDENTIFIER MUST BE UNIQUE, NOT MERELY DERIVED.
         `util.slug` lowercases, collapses every non-alphanumeric run to
         a hyphen and truncates at 48 characters, so two institutions
         with different names can produce the same id — while
         `tenantByName` (exact, trimmed, lower-cased) does not treat them
         as the same institution and so does not reuse the row. Tenant
         isolation is a hard boundary (FRD 1.3.1 / 17/04 §4), so the id
         is made unique before the row is created. */
      var base = 'tenant-' + util.slug(req.institution.name), id = base, n = 1;
      while (tenantById(id)) { n += 1; id = base + '-' + n; }
      tenant = {
        id: id,
        name: req.institution.name,
        kind: req.institution.kind,
        accessContext: req.institution.accessContext,
        status: 'active',
        origin: 'Created from approved request ' + req.id,
        createdOn: nowIso
      };
      S.tenants.push(tenant);
      req.history.push({ at: nowIso, who: 'Super Admin',
        event: 'Institution created — ' + tenant.name,
        note: 'The institution now exists on the platform. It holds no content until access is activated.' });
    } else if (!req.tenantId) {
      req.history.push({ at: nowIso, who: 'Super Admin',
        event: 'Matched to the existing institution ' + tenant.name,
        note: 'No second institution was created.' });
    }
    /* Binds the request to this institution for good, so the payment
       step can never resolve — or create — a different one. */
    req.tenantId = tenant.id;
    return tenant;
  }

  /* Does this institution exist only because a request was approved,
     with nothing activated onto it yet? A real and honest state on the
     external route between approval and payment, and the reason the
     Institutions surfaces must not read it as an ordinary tenant. */
  function tenantAwaitingActivation(tenantId) {
    if (accessForTenant(tenantId).length) { return null; }
    return S.requests.filter(function (r) {
      return r.tenantId === tenantId && r.status === STATUS.APPROVED_PAYMENT_REQUIRED;
    })[0] || null;
  }

  function activateRequest(req, nowIso) {
    /* A RENEWAL activates a DIFFERENT WAY — it extends the term of the
       record it renews instead of writing a new one. Branching here, at
       the single activation entry point, is what makes the renewal
       inherit every gate the ordinary route already passes through:
       the required decision reason, the inactive-institution refusal,
       and — on the external route — the payment step. */
    if (req.renewsAccessId) { return activateRenewal(req, nowIso); }
    /* Provisioning is idempotent and, on both routes, has already run at
       approval. Calling it here RESOLVES the bound institution and
       creates nothing — which is what makes payment unable to produce a
       second tenant for a request that already has one. */
    var tenant = provisionTenantFor(req, nowIso);
    /* Activating twice would write a second access record for the same
       request, doubling the licence quantity the institution holds. */
    if (S.access.some(function (a) { return a.requestId === req.id; })) { return; }
    req.activatedAt = nowIso;
    req.history.push({ at: nowIso, event: 'Tenant access activated for ' + tenant.name, who: 'Platform' });

    /* Tenant content access record — what the tenant now holds.
       The origin actor is the Super Admin (STK31-24): activation flows
       from the Super Admin approval of this request.

       ⚠ Activation creates NO student entitlement. Holding content is
       not the same as any student having it (STK31-25). */
    S.seq.access += 1;
    /* WHAT THE SUPER ADMIN GRANTED, not what the applicant asked for
       (STK31-24 / U-SA-08). `req.grant` is null when the request was
       approved exactly as submitted, which is the ordinary case and the
       behaviour of every earlier build. */
    var granted = req.grant || { items: req.items, quantity: req.quantity, term: req.term };
    var termDef = XRSLP.data.term(granted.term);
    S.access.push({
      id: 'ACC-' + util.pad3(S.seq.access),
      tenantId: tenant.id,
      requestId: req.id,
      items: granted.items.map(function (i) {
        return { experimentId: i.experimentId, technologies: i.technologies.slice() };
      }),
      quantity: granted.quantity,
      term: granted.term,
      accessContext: req.institution.accessContext,
      recordedBy: 'Super Admin — request approval',
      startsOn: nowIso,
      endsOn: termDef ? util.addMonths(nowIso, termDef.months) : null,
      /* Implementation 07.2 — the renewal audit line. Empty is the true
         value for a record that has renewed nothing. */
      renewals: []
    });
  }

  /* ============================================================
     RENEWAL — Implementation 07.2, stakeholder rule D.

     "Tenant should go through same payment method which he follows in
      initial onboarding."

     ── WHAT THIS IS NOT ─────────────────────────────────────────
     It is NOT a Super Admin extension control. There is no writer
     anywhere in this build that lengthens an access term on request:
     `endsOn` is written by `activateRequest` (ordinary onboarding),
     by `activateRenewal` below (only ever after the institution's own
     route has completed), and by `protoSetAccessEnd`, which is the
     explicitly labelled demo clock and is not a product control.
     It is NOT automatic. Nothing renews because a term is ending, and
     nothing renews because a renewal was merely REQUESTED.
     It introduces NO payment provider, NO price and NO invoice.

     ── THE ROUTE COMES FROM THE INSTITUTION ─────────────────────
     `submitRequest` reads `scenario()` for `kind` / `accessContext` /
     `paymentRequired`, because on the public plane the scenario IS the
     requester. A renewal has a real institution behind it, so reading
     the prototype selector there would be a live defect: with the
     external scenario selected, renewing an internal BITS-Community
     institution would put it on the payment route, and vice versa.
     `renewalRouteFor` therefore derives the route from the institution
     and its ORIGINAL onboarding request, and `submitRenewalRequest`
     never calls `scenario()`.

     ── WHY IT EXTENDS RATHER THAN ADDS A RECORD ─────────────────
     A renewal continues the SAME plan. Writing a second access record
     would leave every assignment, faculty mapping and licence
     allocation behind on the old record — the institution would renew
     and find that no student was entitled any more. Rule A's EXPANSION
     is the case that legitimately adds a record, because it adds
     licences; renewal is not that case, and the two are kept apart
     deliberately.

     ── WHAT IS STILL OPEN, AND IS NOT DECIDED HERE ──────────────
     Whether licences, technologies or the term may CHANGE at renewal is
     unresolved. This build fails safe: a renewal MIRRORS the current
     plan exactly, no editing is offered anywhere, and the surfaces say
     so. The 15-day reminder rule is unchanged, and its delivery channel
     remains unresolved — nothing here claims a message was sent.
     ============================================================ */

  /* The institution's ORIGINAL onboarding request — the earliest one
     bound to this tenant. It is what carries the commercial route the
     institution actually came in on. */
  function originRequestFor(tenantId) {
    var bound = S.requests.filter(function (r) { return r.tenantId === tenantId && !r.renewsAccessId; });
    return bound.length ? bound[0] : null;
  }

  /* The route a renewal for this institution must follow. Derived — no
     stored field, so it cannot drift from the institution it describes.

     The fallback when no bound request survives reads the INSTITUTION's
     own `kind`, which is written at provisioning from the original
     request (never from the live scenario). It is never a guess about
     what the institution "probably" is. */
  function renewalRouteFor(tenantId) {
    var t = tenantById(tenantId);
    if (!t) { return null; }
    var origin = originRequestFor(tenantId);
    return {
      tenantId: t.id,
      kind: t.kind,
      accessContext: t.accessContext,
      paymentRequired: origin ? !!origin.paymentRequired : t.kind === 'external',
      originRequestId: origin ? origin.id : null,
      /* This answer is INSTITUTION-wide. It is only safe to print above a
         particular record when every live record agrees — see
         `renewalRouteForAccess`, which is the authority for a renewal. */
      scope: 'institution'
    };
  }

  /* ⚠ THE ROUTE BELONGS TO THE RECORD, NOT THE INSTITUTION — 07.3
     adversarial fix, and the most serious defect found in this pass.

     `renewalRouteFor(tenantId)` answers from `originRequestFor()`, which
     returns the institution's FIRST bound request. Clarification A lets
     one institution hold records that arrived on DIFFERENT routes — a
     BITS Community record and a paid Subscription record — and every one
     of them then inherited the first record's route.

     The consequence broke clarification D in both directions:
       · a SUBSCRIPTION record — one that exists only because a payment
         succeeded — renewed on Super Admin approval ALONE, with no
         payment step ever offered;
       · an INTERNAL record was held behind a payment step it never had.
     And the renewals[] audit line stamped the INSTITUTION's context onto
     the record, so a paid record acquired a permanent entry reading
     "BITS Community · no payment step on this route".

     The record knows its own route. `requestId` names the request that
     created it, and `accessContext` was copied from that request at
     activation. Both are read here, in that order, and the institution is
     consulted only when neither survives. */
  function renewalRouteForAccess(accessId) {
    var rec = accessById(accessId);
    if (!rec) { return null; }
    var t = tenantById(rec.tenantId);
    if (!t) { return null; }
    var origin = rec.requestId ? request(rec.requestId) : null;
    /* A renewal request is not an origin: it inherits, never defines. */
    if (origin && origin.renewsAccessId) { origin = null; }

    var paymentRequired;
    if (origin) {
      paymentRequired = !!origin.paymentRequired;
    } else if (typeof rec.accessContext === 'string' && rec.accessContext) {
      /* The record's own recorded context, which was copied from the
         request that created it. `external` institutions pay. */
      paymentRequired = rec.accessContext !== t.accessContext
        ? rec.accessContext === 'Subscription'
        : t.kind === 'external';
    } else {
      paymentRequired = t.kind === 'external';
    }
    return {
      tenantId: t.id,
      accessId: rec.id,
      kind: t.kind,
      /* THE RECORD'S context, never the institution's. */
      accessContext: rec.accessContext || t.accessContext,
      paymentRequired: paymentRequired,
      originRequestId: origin ? origin.id : null,
      scope: 'record'
    };
  }

  /* Renewal requests raised against one access record, newest last. */
  function renewalRequestsForAccess(accessId) {
    return S.requests.filter(function (r) { return r.renewsAccessId === accessId; });
  }
  /* The one still in flight, if any — submitted, awaiting more
     information, or approved and awaiting payment. */
  function openRenewalForAccess(accessId) {
    return renewalRequestsForAccess(accessId).filter(function (r) {
      return r.status === STATUS.SUBMITTED ||
             r.status === STATUS.INFO_REQUESTED ||
             r.status === STATUS.APPROVED_PAYMENT_REQUIRED;
    })[0] || null;
  }
  function renewalRequestsForTenant(tenantId) {
    return S.requests.filter(function (r) { return r.tenantId === tenantId && !!r.renewsAccessId; });
  }

  /* Why a renewal cannot be raised for this record right now, or null. */
  function renewalBlock(accessId) {
    var rec = accessById(accessId);
    if (!rec) { return 'missing'; }
    if (!tenantIsActive(rec.tenantId)) { return 'tenant-inactive'; }
    if (!renewalRouteForAccess(accessId)) { return 'no-institution'; }
    if (openRenewalForAccess(accessId)) { return 'already-open'; }
    var items = Array.isArray(rec.items) ? rec.items : [];
    if (!items.length) { return 'nothing-to-renew'; }
    return null;
  }
  var RENEWAL_BLOCK_REASON = {
    'missing':          'the access record no longer exists',
    'tenant-inactive':  'the institution has been deactivated by the Super Admin',
    'no-institution':   'this record is not bound to an institution',
    'already-open':     'a renewal for this record is already in progress',
    'nothing-to-renew': 'the record carries no approved experiments'
  };
  function renewalBlockText(reason) {
    return RENEWAL_BLOCK_REASON[reason] || 'a renewal cannot be raised for this record';
  }
  function canRenewAccess(accessId) { return renewalBlock(accessId) === null; }

  /* Raise a renewal. It builds an ORDINARY `requests[]` row, so every
     existing gate — the Super Admin decision, the required reason, the
     inactive-institution refusal, the grant-may-only-narrow rule and
     the three payment outcomes — applies to it unchanged and no second
     decision surface exists.

     The plan is COPIED from the record being renewed and is not
     widened. That keeps `validateGrant`'s narrowing invariant trivially
     satisfied and keeps the unresolved "may a renewal change the plan?"
     question genuinely open rather than answered by accident. */
  function submitRenewalRequest(accessId, form) {
    var blocked = renewalBlock(accessId);
    if (blocked) { return { ok: false, reason: blocked, request: null }; }
    var rec = accessById(accessId);
    /* PER RECORD. See `renewalRouteForAccess`. */
    var route = renewalRouteForAccess(accessId);
    var tenant = tenantById(rec.tenantId);
    var origin = route.originRequestId ? request(route.originRequestId) : null;
    var f = form || {};
    var now = new Date().toISOString();
    S.seq.request += 1;
    var req = {
      id: 'REQ-' + util.pad3(S.seq.request),
      /* The scenario is recorded for traceability only. NOTHING about
         this request's route is taken from it. */
      scenarioId: S.scenarioId,
      institution: {
        name: tenant.name,
        kind: route.kind,
        accessContext: route.accessContext,
        contactName: String(f.contactName || (origin ? origin.institution.contactName : '') || '').trim(),
        contactEmail: String(f.contactEmail || (origin ? origin.institution.contactEmail : '') || '').trim()
      },
      paymentRequired: route.paymentRequired,
      /* MIRRORS THE CURRENT PLAN. Copied, never widened. */
      items: rec.items.map(function (i) {
        return { experimentId: i.experimentId, technologies: i.technologies.slice() };
      }),
      quantity: rec.quantity,
      term: rec.term,
      /* THE ONE FIELD THAT MAKES THIS A RENEWAL. */
      renewsAccessId: rec.id,
      status: STATUS.SUBMITTED,
      submittedAt: now,
      approvedAt: null,
      activatedAt: null,
      /* Bound at submission, so the institution can never be re-resolved
         by name and a renewal can never provision a second tenant. */
      tenantId: rec.tenantId,
      history: [
        { at: now, event: 'Renewal requested for ' + rec.id, who: tenant.name,
          note: String(f.note || '').trim() }
      ]
    };
    S.requests.push(req);
    save();
    return { ok: true, reason: null, request: req };
  }

  /* Activation of a renewal. Reached ONLY through `activateRequest`,
     which is reached only from `approveRequest` on the internal route
     and from a SUCCESSFUL `completePayment` on the external one.

     It writes the TERM and the audit line, and nothing else: no new
     access record, no new licence, no new Experiment, no new technology,
     no assignment and no entitlement. The renewed record keeps its id,
     so every assignment, faculty mapping and learning record that
     already points at it stays exactly where it is. */
  function activateRenewal(req, nowIso) {
    var rec = accessById(req.renewsAccessId);
    if (!rec) { return; }
    /* Activating twice would extend the same term twice. */
    if (req.activatedAt) { return; }
    /* `approveRequest` refuses a grant on a renewal, so this is always
       the mirrored plan. Reading it through the same expression the
       ordinary path uses keeps the two in step if that ever changes —
       and the assertion below refuses to activate a renewal carrying a
       plan this function would not fully apply, rather than applying
       half of it. */
    var granted = req.grant || { items: req.items, quantity: req.quantity, term: req.term };
    if (req.grant) { return; }
    var termDef = XRSLP.data.term(granted.term);
    if (!termDef) { return; }
    /* THE NEW TERM RUNS FROM WHICHEVER IS LATER: the current end, or
       now. Renewing early therefore adds to what is left rather than
       silently discarding it, and renewing after expiry starts from
       today rather than back-dating a term nobody could use.
       IMPLEMENTATION JUDGEMENT — recorded as one, not stakeholder
       policy, and stated on the renewal surfaces. */
    var currentEnd = rec.endsOn ? new Date(rec.endsOn).getTime() : NaN;
    var base = (!isNaN(currentEnd) && currentEnd > new Date(nowIso).getTime()) ? rec.endsOn : nowIso;
    var previousEndsOn = rec.endsOn;
    req.activatedAt = nowIso;
    rec.endsOn = util.addMonths(base, termDef.months);
    if (!Array.isArray(rec.renewals)) { rec.renewals = []; }
    rec.renewals.push({
      at: nowIso,
      requestId: req.id,
      term: granted.term,
      previousEndsOn: previousEndsOn,
      endsOn: rec.endsOn,
      /* THE RECORD'S OWN CONTEXT. Stamping the request's institution-level
         value wrote a false provenance onto a record whose route differed
         from the institution's first one. */
      accessContext: rec.accessContext || req.institution.accessContext,
      route: req.paymentRequired ? 'payment' : 'no-payment',
      recordedBy: req.paymentRequired
        ? 'Super Admin approval — activated on payment'
        : 'Super Admin approval — no payment step on this route'
    });
    req.history.push({
      at: nowIso, who: 'Platform',
      event: 'Renewal activated — ' + rec.id + ' now runs to ' + rec.endsOn,
      note: req.paymentRequired
        ? 'Activated after the institution completed the same payment step it was onboarded through.'
        : 'No payment step exists on this institution’s access route.'
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
    'tenant-inactive': 'the institution has been deactivated by the Super Admin',
    'expired':         'its access term has expired',
    'no-experiments':  'it carries no approved experiments',
    'no-technologies': 'it carries no approved technology variants',
    'no-quantity':     'it carries no approved user/licence quantity'
  };

  function accessAssignability(rec, tenantId) {
    if (!rec) { return 'missing'; }
    if (tenantId && rec.tenantId !== tenantId) { return 'other-tenant'; }
    /* Implementation 06 — tenant deactivation (STK31-21 / STK31-22).
       Deactivation is a REVERSIBLE state on the tenant, never a deletion:
       the access record, its licence quantity, its term, every assignment
       and every learning record stay exactly as they were, and this one
       derived reason is what stops them carrying authority. Reactivating
       the tenant restores precisely what was still valid. */
    if (!tenantIsActive(rec.tenantId)) { return 'tenant-inactive'; }
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

  /* ============================================================
     WHAT THIS INSTITUTION ALREADY HOLDS FOR ONE EXPERIMENT
     — Implementation 07.2, stakeholder rule A.

     "If the same institution requests the same experiment again, they
      can request additional licenses. It should show the existing plan
      when they reselect."

     NOTHING HERE BLOCKS ANYTHING. This is a read model and only a read
     model: it answers "what is already in place?" so the requester, the
     Super Admin deciding, and the Tenant Admin can all see that a
     second request is an EXPANSION of existing institutional access
     rather than an accidental repeat purchase.

     ONE ROW PER ACCESS RECORD, never a blended summary. Two records
     carrying the same Experiment have independent technologies, terms
     and licence quantities, and one can expire while the other runs —
     collapsing them into a single "current plan" would state something
     that is not true of either. `accessTermState` is read per record
     for exactly that reason.
     ============================================================ */
  function tenantAccessForExperiment(tenantId, experimentId) {
    if (!tenantId || !experimentId) { return []; }
    return accessForTenant(tenantId)
      .filter(function (rec) { return accessHasExperiment(rec, experimentId); })
      .map(function (rec) {
        return {
          record: rec,
          technologies: accessTechnologies(rec, experimentId),
          termState: accessTermState(rec),
          allocation: accessAllocation(rec.id),
          live: accessIsLive(rec),
          assignable: accessIsAssignable(rec, tenantId),
          reason: accessAssignability(rec, tenantId)
        };
      });
  }
  /* The plain predicate, restricted to records whose term is still
     running. A record that has expired is still shown by the read model
     above — it is real history and the requester should see it — but it
     is not what "already holds" means. */
  function tenantHoldsExperiment(tenantId, experimentId) {
    return tenantAccessForExperiment(tenantId, experimentId).some(function (row) { return row.live; });
  }
  /* The subset of a selection basket this institution already holds.
     Returns [{ experimentId, rows }] and nothing for an anonymous
     requester, so a surface can ask the question once. */
  function heldSelectionFor(tenantId, items) {
    if (!tenantId || !Array.isArray(items)) { return []; }
    var out = [];
    items.forEach(function (i) {
      var rows = tenantAccessForExperiment(tenantId, i.experimentId);
      if (rows.length) { out.push({ experimentId: i.experimentId, rows: rows }); }
    });
    return out;
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
    /* Implementation-06 tenant-plane write guard — a deactivated tenant
       takes no operational action (STK31-21 / 22). Nothing is deleted;
       the guard simply refuses the write. */
    if (!tenantCanWrite(tenantId)) { return null; }
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
    /* Implementation-06 tenant-plane write guard — a deactivated tenant
       takes no operational action (STK31-21 / 22). Nothing is deleted;
       the guard simply refuses the write. */
    if (!tenantCanWrite(tenantId)) { return null; }
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
    /* A REDUNDANT CALL MUST NOT MOVE THE ALLOCATION QUEUE. Reactivating
       an already-active student re-stamped `activationSeq`, sending them
       to the BACK of the queue — so a no-op handed their own licence to
       whoever was waiting behind them. The re-stamp is correct for a
       real reactivation (README judgement call 4) and wrong for a
       status that is not changing. */
    if (p.status === status) { return p; }
    /* Implementation-06 tenant-plane write guard — a deactivated tenant
       takes no operational action (STK31-21 / 22). Nothing is deleted;
       the guard simply refuses the write. */
    if (!tenantCanWrite(p.tenantId)) { return null; }
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

  /* STK31-25 — "Student removal / deactivation: Tenant Admin may perform
     it; SUPER ADMIN MAY ALSO PERFORM IT AS A PLATFORM OVERRIDE."

     The same one writer, reached from the platform plane and recorded as
     such. It is deliberately NOT a second status field and NOT a second
     store: an override that produced a different kind of inactive would
     be two truths about one student. It changes only the person's own
     status, exactly as the tenant-plane action does — and therefore
     releases or re-queues that student's licence by the same rule
     (README judgement calls 3 and 4), and mutates no assignment, no
     access record and no learning record.

     The deactivated-tenant guard is kept: a deactivated institution
     takes no operational write from either plane (STK31-21 / 22), and
     an override there would change nothing a student could observe. */
  function setStudentStatusAsPlatform(personId, status, reason) {
    var p = personById(personId);
    if (!p || p.role !== 'student') { return null; }
    var note = String(reason || '').trim();
    if (!note) { return null; }
    var before = p.status;
    var out = setStudentStatus(personId, status);
    if (!out) { return null; }
    if (!Array.isArray(p.overrides)) { p.overrides = []; }
    p.overrides.push({
      at: new Date().toISOString(),
      from: before, to: out.status,
      by: 'Super Admin — platform override',
      reason: note
    });
    /* Recorded on the tenant's governance history too, so the
       institution's own audit trail shows a platform action taken on
       one of its people rather than an unexplained change. */
    var t = tenantById(p.tenantId);
    if (t) {
      pushTenantEvent(t, 'student-override',
        (out.status === 'inactive' ? 'Student deactivated' : 'Student reactivated') +
        ' by platform override — ' + p.name,
        'Super Admin', note);
    }
    save();
    return out;
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
    /* Implementation-06 tenant-plane write guard — a deactivated tenant
       takes no operational action (STK31-21 / 22). Nothing is deleted;
       the guard simply refuses the write. */
    if (!tenantCanWrite(tenantId)) { return null; }
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
    if (!tenantCanWrite(g.tenantId)) { return null; }
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
    if (!tenantCanWrite(g.tenantId)) { return false; }
    if (isMember(groupId, personId)) { return false; }
    S.seq.membership += 1;
    S.seq.event += 1;
    S.memberships.push({
      id: 'GM-' + util.pad3(S.seq.membership),
      tenantId: g.tenantId, groupId: groupId, personId: personId,
      /* A monotonic ordering stamp, like the one every assignment and
         every person activation carries. The allocation queue needs to
         know WHEN a student first came within reach of an access record,
         and for a group member that is when they joined the group — not
         when the group was assigned. See `accessAllocation`. */
      eventSeq: S.seq.event,
      addedAt: new Date().toISOString()
    });
    save();
    return true;
  }
  function removeFromGroup(groupId, personId) {
    var grp = groupById(groupId);
    if (grp && !tenantCanWrite(grp.tenantId)) { return false; }
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
    if (!tenantCanWrite(tenantId)) { return null; }
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
    if (!tenantCanWrite(tenantId)) { return false; }
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
    if (!tenantCanWrite(tenantId)) { return null; }
    /* THE TENANT BOUNDARY, ENFORCED HERE AND NOT ONLY IN THE PICKER.
       FRD 1.3.1 tenant isolation is a hard authority boundary
       (17/04 §4): a Faculty member of one institution can never be
       given authority inside another. The screen only ever lists this
       tenant's own Faculty, so this guard is not reachable through the
       UI — which is exactly why it belongs at the state layer, where a
       hand-typed call has to meet it too. */
    var subject = personById(personId);
    if (!subject || subject.role !== 'faculty' || subject.tenantId !== tenantId) { return null; }
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
    if (!tenantCanWrite(f.tenantId)) { return false; }
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
  /* THE SAME reach, but paired with the ordering stamp at which each
     person actually came within reach of this assignment.

     For a direct assignment that is the assignment's own stamp. For a
     GROUP assignment it is the LATER of the assignment and the person's
     membership — because a member added to an already-assigned group was
     reached at the moment they joined, not when the group was assigned.

     Without this every member of a group shared one stamp, the queue fell
     back to comparing ids, and adding a member whose id happened to sort
     earlier took a licence off somebody who already held one. */
  function assignmentReachStamped(a) {
    var base = typeof a.eventSeq === 'number' ? a.eventSeq : 0;
    if (a.targetType === 'student') { return [{ personId: a.targetId, seq: base }]; }
    if (a.targetType !== 'group') { return []; }
    return S.memberships.filter(function (m) { return m.groupId === a.targetId; })
      .map(function (m) {
        var joined = typeof m.eventSeq === 'number' ? m.eventSeq : 0;
        return { personId: m.personId, seq: Math.max(base, joined) };
      });
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

    var first = {};   /* personId → earliest stamp at which they came within reach of this record */
    assignmentsForAccess(rec.tenantId, accessId).forEach(function (a) {
      assignmentReachStamped(a).forEach(function (row) {
        var p = personById(row.personId);
        if (!p || p.role !== 'student' || p.status !== 'active') { return; }
        if (first[row.personId] == null || row.seq < first[row.personId]) {
          first[row.personId] = row.seq;
        }
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
    /* ⚠ THIS IS AN ALLOCATION FIGURE, NOT AN ENTITLEMENT FIGURE — how
       many distinct students HOLD A LICENCE under this institution's live
       access records. It deliberately carries no tenant-status term,
       because deactivating an institution must not silently rewrite its
       licence allocation: approved, assigned and remaining all stay
       exactly as they were, and so does this.

       It is therefore NOT the answer to "how many students are entitled".
       A deactivated institution has licence holders and NO effective
       entitlement at the same time, and both statements are true. For
       effective entitlement — the question every learner-facing surface
       is actually asking — use `entitledStudentIds(tenantId)`, which is
       tenant-status aware, or `entitledStudentsFor()` per experiment.

       `uniqueEntitledStudents` is kept as-is so nothing reading it
       breaks, but it is a MISLEADING NAME that already caused exactly one
       defect: the Tenant Admin Overview rendered it under the label
       "Entitled students" and contradicted both the Super Admin
       institution page and its own "N active students with no
       entitlement" row. Prefer `uniqueLicenceHolders`. */
    totals.uniqueLicenceHolders = Object.keys(uniq).length;
    totals.uniqueEntitledStudents = totals.uniqueLicenceHolders;
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
    /* An unrecognised targetType fell through every branch below — the
       reach was empty, so nothing was counted, and the commit then wrote
       an assignment row nothing could ever derive an entitlement from.
       There are exactly two kinds of target (STK31-25). */
    if (targetType !== 'student' && targetType !== 'group') { out.reason = 'bad-target-type'; return out; }

    out.technologies = accessTechnologies(rec, experimentId);
    var alloc = accessAllocation(accessId);
    out.alloc = alloc;
    var counted = {};
    alloc.entitledIds.concat(alloc.heldIds).forEach(function (id) { counted[id] = true; });

    /* THE TENANT BOUNDARY ON THE TARGET, ENFORCED HERE.
       `rec.tenantId !== tenantId` above protects the ACCESS side; this
       protects the RECEIVING side. Assignment is the only writer of
       student entitlement (STK31-25), so a target belonging to another
       institution would be an entitlement written across the tenant
       isolation boundary (FRD 1.3.1 / 17/04 §4). The screens only ever
       offer this tenant's own students and groups, so this is
       unreachable through the UI — which is why it is asserted at the
       state layer rather than assumed from the picker. */
    var foreignTargets = (targetIds || []).filter(function (tid) {
      var g = targetType === 'group' ? groupById(tid) : personById(tid);
      return !g || g.tenantId !== tenantId;
    });
    if (foreignTargets.length) { out.reason = 'other-tenant-target'; out.foreignTargets = foreignTargets; return out; }

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
    if (!tenantCanWrite(a.tenantId)) { return false; }
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
        /* `tenant-inactive` sits ABOVE the student's own status: when the
           whole institution is deactivated, that is the true and most
           explanatory cause, and telling the Student their own account is
           the problem would be wrong. Nothing below is recomputed or
           discarded — the allocation ordering, the assignments and every
           attempt survive, so reactivation restores this exact state. */
        var blocked =
          !tenantIsActive(p.tenantId) ? 'tenant-inactive' :
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
    /* Implementation 06 — the same answer the entitlement engine gives.
       Without this, a deactivated institution's report would still claim
       students hold effective entitlement while every one of them is
       refused at launch. */
    if (!tenantIsActive(rec.tenantId)) { return []; }
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
    if (!tenantIsActive(tenantId)) { return []; }
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
  var BLOCK_PRIORITY = ['tenant-inactive', 'student-inactive', 'allocation-held', 'access-expired'];

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
     an anonymous evaluator. `finaliseReview` is what resolves it, and it
     is the only writer that does. */
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
    var asm = assessmentForStudent(personId, experimentId);
    if (!asm) { return 'no-assessment'; }
    /* A configured assessment carrying no questions is a real state —
       Faculty create the assessment before choosing its questions — and
       it must not be startable. Without this an attempt is created over
       an empty question list, scores `null%`, and resolves to NOT PASSED
       against a paper the Student was never shown. */
    if (!asm.questions.length) { return 'no-questions'; }
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
  /* ⚠ RUN EVIDENCE ONLY — 07.3 adversarial fix.

     This ranked on `completedAt || startedAt || readyAt || requestedAt`,
     so merely REQUESTING a VR package — or the platform marking one ready
     — outranked a Web run the student had actually completed. The value
     is stamped onto `attempt.sourceTechnology` and rendered as a factual
     claim on three screens ("Taken after VR simulation"), so the
     stakeholder's exact question was being answered with a technology the
     student never opened.

     Only IN_PROGRESS and COMPLETED records count, ranked on
     `completedAt || startedAt`. No run means null, and every reader
     already renders nothing for null. */
  function latestSimulationTechnology(personId, experimentId) {
    var best = null, bestAt = '';
    S.simulationActivity.forEach(function (sim) {
      if (sim.personId !== personId || sim.experimentId !== experimentId) { return; }
      if (sim.status !== SIM_STATUS.IN_PROGRESS && sim.status !== SIM_STATUS.COMPLETED) { return; }
      var at = sim.completedAt || sim.startedAt || '';
      /* `>=`, not `>`: two runs finished inside the same millisecond
         carry identical timestamps, and the later ENTRY is the later run.
         Strict `>` would silently prefer whichever was recorded first. */
      if (!best || at >= bestAt) { bestAt = at; best = sim.technology; }
    });
    return best;
  }

  /* ---------- TECHNOLOGY ACTUALLY USED (07.3, stakeholder R6) ----------
     The stakeholder's question was specific: *"if the student is
     performing the experiment in AR and VR ... we need the tag, whether
     he has performed this experiment in web or VR"*, and *"if the faculty
     is giving the assessment marks, how he will know it is a web
     assignment or a VR thing"*.

     ⚠ THIS IS NOT `mappedTechnologies()`. That answers "what did the
     institution license for this student" — AVAILABILITY. This answers
     "what did the student actually run" — USE. They are different
     questions with different answers, and the Faculty review screen was
     showing the first while the stakeholder asked for the second.

     ⚠ IT IS A SET, NOT A VALUE. `latestSimulationTechnology()` returns
     ONE technology — the most recent — which is exactly the "do not
     falsely claim one technology if the student used multiple"
     prohibition. A student who ran Web and then VR gets both here.

     "Used" means the student genuinely engaged: a simulation record at
     IN_PROGRESS or COMPLETED. A record that exists only because device
     access was REQUESTED is reported separately as `requested`, because
     asking for a package is not performing the experiment. */
  function technologiesUsedFor(personId, experimentId) {
    var byTech = {};
    S.simulationActivity.forEach(function (sim) {
      if (sim.personId !== personId || sim.experimentId !== experimentId) { return; }
      byTech[sim.technology] = sim;
    });
    return data.TECH_ORDER.filter(function (t) { return byTech[t]; }).map(function (t) {
      var sim = byTech[t];
      return {
        technology: t,
        status: sim.status,
        used: sim.status === SIM_STATUS.IN_PROGRESS || sim.status === SIM_STATUS.COMPLETED,
        completed: sim.status === SIM_STATUS.COMPLETED,
        startedAt: sim.startedAt || null,
        completedAt: sim.completedAt || null,
        deliveryState: sim.deliveryState || null
      };
    });
  }

  /* The whole answer in one object, so a screen never has to re-derive
     it and two screens can never disagree about it. */
  function technologyUseSummary(personId, experimentId) {
    var rows = technologiesUsedFor(personId, experimentId);
    var used = rows.filter(function (r) { return r.used; });
    return {
      rows: rows,
      used: used.map(function (r) { return r.technology; }),
      completed: rows.filter(function (r) { return r.completed; })
        .map(function (r) { return r.technology; }),
      inProgress: rows.filter(function (r) { return r.used && !r.completed; })
        .map(function (r) { return r.technology; }),
      /* Access requested, never run. Reported, never counted as used. */
      requestedOnly: rows.filter(function (r) { return !r.used; })
        .map(function (r) { return r.technology; }),
      /* True when the platform has recorded NO run at all. The screen
         must say that rather than implying a technology. */
      none: used.length === 0,
      multiple: used.length > 1
    };
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
    var asm = assessmentForStudent(personId, experimentId);
    S.seq.attempt += 1;
    var rec = {
      id: 'ATT-' + util.pad3(S.seq.attempt),
      tenantId: p.tenantId, personId: personId,
      experimentId: experimentId,
      sourceTechnology: latestSimulationTechnology(personId, experimentId),
      assessmentId: asm.id,
      /* THE HISTORICAL INTEGRITY GUARANTEE (brief §40). The attempt
         carries its own copy of the questions, marks, answer key and
         rubric it is being taken against. Every later Faculty edit —
         a reworded question, a changed key, a deleted Question Bank
         item — leaves this attempt exactly as it was answered. */
      snapshot: snapshotOfDefinition(asm),
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
    var asm = attemptAssessment(attempt);
    if (!asm) { return 0; }
    return asm.questions.filter(function (q) {
      var v = attempt.answers[q.id];
      return v !== undefined && v !== null && v !== '';
    }).length;
  }
  function unansweredQuestions(attempt) {
    var asm = attemptAssessment(attempt);
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
    var asm = attemptAssessment(a);
    if (!asm) { return null; }

    a.status = ATTEMPT_STATUS.SUBMITTED;
    a.submittedAt = new Date().toISOString();
    /* Submission creates the REVIEW OBLIGATION for every written
       answer. The Student is told "Pending Faculty review"; this is the
       record that puts the response in a real Faculty queue. */
    asm.questions.forEach(function (q) {
      if (q.type !== 'descriptive') { return; }
      S.seq.review += 1;
      S.reviews.push({
        id: 'REV-' + util.pad3(S.seq.review),
        tenantId: a.tenantId, attemptId: a.id, questionId: q.id,
        personId: a.personId, experimentId: a.experimentId,
        maxMarks: q.points || 1,
        status: 'pending', marks: null, feedback: '',
        reviewedBy: null, reviewedAt: null,
        assistance: null,
        createdAt: a.submittedAt
      });
    });
    recomputeAttempt(a);
    save();
    return a;
  }

  /* ---------- ONE scoring function ----------
     Called at submission and again after each Faculty review, so the
     score a Student sees can never drift from the marks that exist.

     Before every written answer has been reviewed, the score reports
     the OBJECTIVE questions only — the figure Implementation 03 already
     showed — and the outcome stays PENDING_FACULTY_REVIEW. Once Faculty
     have finished, the descriptive marks join the total and the outcome
     is decided against the pass mark the attempt was taken under
     (brief §29). */
  function recomputeAttempt(a) {
    var asm = attemptAssessment(a);
    if (!asm) { return a; }
    var objEarned = 0, objTotal = 0;
    asm.questions.forEach(function (q) {
      if (q.type === 'descriptive') { return; }
      var pts = q.points || 1;
      objTotal += pts;
      var given = a.answers[q.id];
      if ((q.type === 'mcq' || q.type === 'tf') && given === q.answer) { objEarned += pts; }
    });
    var revs = reviewsForAttempt(a.id);
    var descTotal = 0, descEarned = 0, pending = 0;
    revs.forEach(function (r) {
      descTotal += r.maxMarks || 0;
      if (r.status === 'completed') { descEarned += (typeof r.marks === 'number' ? r.marks : 0); }
      else { pending += 1; }
    });
    var complete = revs.length === 0 || pending === 0;
    var earned = complete ? objEarned + descEarned : objEarned;
    var total = complete ? objTotal + descTotal : objTotal;
    a.score = {
      earned: earned, total: total,
      percent: total > 0 ? Math.round((earned / total) * 100) : null,
      objectiveEarned: objEarned, objectiveTotal: objTotal,
      descriptiveEarned: complete ? descEarned : null,
      descriptiveTotal: descTotal,
      pendingReviews: pending,
      includesReview: complete && revs.length > 0
    };
    if (!complete) {
      a.outcome = OUTCOME.PENDING_REVIEW;
      a.reviewCompletedAt = null;
    } else {
      a.outcome = (a.score.percent !== null && a.score.percent >= (asm.passMark || 0))
        ? OUTCOME.PASSED : OUTCOME.NOT_PASSED;
      if (revs.length) {
        var stamps = revs.map(function (r) { return r.reviewedAt || ''; }).sort();
        a.reviewCompletedAt = stamps[stamps.length - 1] || null;
      }
    }
    return a;
  }

  /* ---------- answer / explanation visibility policy (STK31-32) ----------
     Three CONFIRMED general options and no invented fourth. The BITS /
     Taxila rule is NOT modelled (ND-10) and nothing here claims it.
     D-25 is untouched: the key is never exposed during an attempt,
     whatever this returns. */
  function assessmentRelease(assessment) {
    var out = { mode: null, label: '', releaseAt: null, released: false, sentence: '', unresolved: false };
    if (!assessment || !assessment.policy) { return out; }
    var pol = assessment.policy;
    out.mode = pol.mode;
    out.label = data.policyLabel(pol.mode);
    if (pol.mode === 'SHOW_IMMEDIATELY') {
      out.released = true;
      out.sentence = 'Your score and the explanations are shown as soon as you submit.';
      return out;
    }
    /* Three shapes resolve here, and no fourth mode exists (ND-10 is not
       invented):
         · AFTER_DEADLINE  → the assessment's own deadline date
         · CUSTOM_DATE     → the date Faculty set on the policy
         · offsetDays      → the seeded sample form, days from the seed
                             instant, kept so an older stored state and
                             the read-only sample data still resolve. */
    var at = null;
    if (pol.mode === 'AFTER_DEADLINE') { at = assessment.deadline || null; }
    else if (pol.mode === 'CUSTOM_DATE') { at = pol.date || null; }
    if (!at && typeof pol.offsetDays === 'number') {
      at = util.addDays(seededAt() || new Date().toISOString(), pol.offsetDays);
    }
    if (!at) {
      /* A delayed policy with no date cannot honestly claim a release
         moment. Nothing is released, and the sentence says why rather
         than inventing a date. */
      out.unresolved = true;
      out.released = false;
      out.sentence = pol.mode === 'AFTER_DEADLINE'
        ? 'Your answers and the explanations become available after the assessment deadline. No deadline has been set yet.'
        : 'Your answers and the explanations become available on a date your faculty set. That date has not been set yet.';
      return out;
    }
    out.releaseAt = at;
    out.released = new Date(at).getTime() <= Date.now();
    out.sentence = pol.mode === 'AFTER_DEADLINE'
      ? 'Your answers and the explanations become available after the assessment deadline on ' +
        util.fmtDate(at) + '.'
      : 'Your answers and the explanations become available on ' + util.fmtDate(at) + '.';
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
    PENDING_REVIEW: 'PENDING_FACULTY_REVIEW',
    /* The evaluation is FINISHED but the Faculty-configured visibility
       policy has not released the result yet. A STUDENT-VIEW state only —
       see `resultWithheld` below. */
    RESULT_WITHHELD: 'RESULT_WITHHELD',
    COMPLETED: 'COMPLETED'
  };

  /* ⚠ THE INDIRECT-DISCLOSURE GUARD.

     A result that has been evaluated but not yet released must not be
     inferable from any other Student-facing status. It is: the roll-up
     counts the assessment step only when the outcome is PASSED, so with
     every other activity finished, "Completed / 100%" means passed and
     "In progress / 86%" means not passed — the withheld outcome, read
     straight off the progress screen.

     `resultWithheld` marks that window. Under `opts.studentView` the
     derivations below then treat the assessment as UNDECIDED, so a
     passing and a failing Student produce byte-identical progress until
     the policy releases.

     It is deliberately NOT applied without `studentView`: Faculty
     performed the evaluation and must keep seeing it (audit §9), and the
     Faculty analytics read the same derivation. */
  /* ── THE ONE RELEASE DECISION ──────────────────────────────────
     `scoreWithheld` answers the only question every Student-facing
     score surface needs to ask: are marks and outcome hidden from this
     Student right now? It is simply "a submitted attempt exists and the
     Faculty-configured policy has not released it", and it deliberately
     does NOT care whether the marking was automatic or human.

     ⚠ "Automatically marked" is not the same as "released". An
     objective-only assessment is scored the instant it is submitted, but
     under AFTER_DEADLINE or CUSTOM_DATE that score is a withheld result
     like any other. Treating machine marking as self-releasing was the
     residual channel: the objective sub-score stayed on screen while the
     outcome it determines was being withheld, and a Student whose
     objective marks already put the pass mark out of reach could read
     the hidden outcome straight off it.

     SHOW_IMMEDIATELY always resolves to released, so this is false for
     every assessment that does not delay. */
  function scoreWithheld(personId, experimentId) {
    var last = latestSubmittedAttempt(personId, experimentId);
    if (!last) { return false; }
    return !releaseFor(last).released;
  }

  /* The subset of `scoreWithheld` where the result has actually been
     DECIDED — the case the progress roll-up must neutralise, because a
     decided outcome is what "Completed vs In progress" would otherwise
     publish. A still-pending review is excluded: it has its own honest
     Student state, `Pending Faculty review`. */
  function resultWithheld(personId, experimentId) {
    var last = latestSubmittedAttempt(personId, experimentId);
    if (!last) { return false; }
    if (last.outcome !== OUTCOME.PASSED && last.outcome !== OUTCOME.NOT_PASSED) { return false; }
    return scoreWithheld(personId, experimentId);
  }

  /* ONE assessment state per Experiment, whatever the Student was
     licensed in. */
  function assessmentState(personId, experimentId) {
    var asm = assessmentForStudent(personId, experimentId);
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
  function technologyProgress(personId, experimentId, technology, opts) {
    var sim = simulationActivity(personId, experimentId, technology);
    var simStatus = sim ? sim.status : SIM_STATUS.NOT_STARTED;
    /* Experiment-level, exactly like the resources: the same assessment
       state appears against every technology row, because there is one
       assessment. Only the SIMULATION differs by technology. */
    var assess = assessmentState(personId, experimentId);
    /* Student view: an evaluated-but-unreleased result is UNDECIDED here,
       so passing and failing cannot be told apart. */
    var withheld = !!(opts && opts.studentView) && resultWithheld(personId, experimentId);
    var res = resourceProgress(personId, experimentId);
    var resourcesComplete = res.total === 0 || res.completed === res.total;
    var learningDone = simStatus === SIM_STATUS.COMPLETED && !withheld &&
      (assess === ASSESS_STATE.NONE || assess === ASSESS_STATE.PASSED);
    var status;
    if (learningDone && resourcesComplete) {
      status = TECH_PROGRESS.COMPLETED;
    } else if (withheld && simStatus === SIM_STATUS.COMPLETED && resourcesComplete) {
      status = TECH_PROGRESS.RESULT_WITHHELD;
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
      /* Masked in the Student view for the same reason as the status. */
      assessment: withheld ? TECH_PROGRESS.RESULT_WITHHELD : assess,
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
    var asm = assessmentForStudent(personId, experimentId);
    var res = resourceProgress(personId, experimentId);
    var withheld = !!opts.studentView && resultWithheld(personId, experimentId);
    var rows = techs.map(function (t) {
      return technologyProgress(personId, experimentId, t, opts);
    });

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
    } else if (rows.some(function (r) { return r.status === TECH_PROGRESS.RESULT_WITHHELD; }) &&
               rows.every(function (r) {
                 return r.status === TECH_PROGRESS.RESULT_WITHHELD || r.status === TECH_PROGRESS.COMPLETED;
               })) {
      status = TECH_PROGRESS.RESULT_WITHHELD;
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
    /* The withheld window counts the assessment step as NOT DONE for
       both a passing and a failing Student — otherwise the percentage
       alone would publish the outcome the result screen is holding. */
    var stepsDone = res.completed +
      (asm && !withheld && assessState === ASSESS_STATE.PASSED ? 1 : 0);
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
      entitled: 0, notStarted: 0, inProgress: 0, awaiting: 0, awaitingRelease: 0, completed: 0,
      unavailable: 0, items: []
    };
    rows.forEach(function (row) {
      if (!row.effective) { out.unavailable += 1; return; }
      out.entitled += 1;
      /* This is a STUDENT roll-up, so it takes the Student view. */
      var prog = experimentProgress(personId, row.experimentId, row.technologies, { studentView: true });
      out.items.push({ row: row, progress: prog });
      if (prog.status === TECH_PROGRESS.COMPLETED) { out.completed += 1; }
      else if (prog.status === TECH_PROGRESS.RESULT_WITHHELD) { out.awaitingRelease += 1; }
      else if (prog.status === TECH_PROGRESS.PENDING_REVIEW) { out.awaiting += 1; }
      else if (prog.status === TECH_PROGRESS.IN_PROGRESS) { out.inProgress += 1; }
      else { out.notStarted += 1; }
    });
    return out;
  }

  /* ============================================================
     IMPLEMENTATION 04 — FACULTY

     Four conceptual records join the model, and not one of them is an
     entitlement or can create one:

       questions[]       QuestionBankItem      — tenant-scoped, Faculty-owned
       assessmentDefs[]  AssessmentDefinition  — tenant + EXPERIMENT
       reviews[]         DescriptiveReview     — attempt + descriptive question
       facultyPrefs      a Faculty workflow preference, not a role

     ── THE TWO ALTITUDES THIS SLICE MUST NOT COLLAPSE ────────────
        FACULTY MAPPING        which content a Faculty member manages
              ≠
        STUDENT ENTITLEMENT    which content a Student may open

     A Faculty member manages an Experiment's assessment because of a
     FacultyAssignment. A Student appears in that Experiment's reach
     only through EFFECTIVE ENTITLEMENT — never through course
     membership, group membership or tenant access (brief §9 / §36).

     ── ASSESSMENT IS PER EXPERIMENT · SIMULATION IS PER TECHNOLOGY ─
     Unchanged from Implementation 03, and the reasoning is recorded at
     the head of the Implementation-03 section above. Faculty configure
     ONE assessment for an Experiment however many technology variants
     the Tenant holds.
     ============================================================ */

  /* ---------- PROTOTYPE-ONLY faculty selection ----------
     The same shape as the Student pointer: a record of WHICH REAL
     TenantUser the prototype is viewing as. Not authentication, and it
     grants nothing — what a Faculty member can reach still comes only
     from their mappings. */
  function protoFacultyId() { return S.protoFacultyId || null; }
  function setProtoFaculty(personId) {
    S.protoFacultyId = personId || null;
    save();
    return S.protoFacultyId;
  }
  function protoFaculty() {
    var p = S.protoFacultyId ? personById(S.protoFacultyId) : null;
    return (p && p.role === 'faculty') ? p : null;
  }

  /* ---------- Faculty workflow preference (brief §28) ----------
     `manual` or `assisted`. It changes ONE thing: whether the review
     screen offers the assistance affordance. Faculty remain the only
     evaluator either way (STK31-31). */
  var REVIEW_MODE = { MANUAL: 'manual', ASSISTED: 'assisted' };
  function facultyPref(personId) {
    var pref = S.facultyPrefs[personId] || {};
    return { reviewMode: pref.reviewMode === REVIEW_MODE.ASSISTED ? REVIEW_MODE.ASSISTED : REVIEW_MODE.MANUAL };
  }
  function setFacultyReviewMode(personId, mode) {
    if (!S.facultyPrefs[personId]) { S.facultyPrefs[personId] = {}; }
    S.facultyPrefs[personId].reviewMode =
      mode === REVIEW_MODE.ASSISTED ? REVIEW_MODE.ASSISTED : REVIEW_MODE.MANUAL;
    save();
    return facultyPref(personId);
  }

  /* ============================================================
     THE FACULTY CONTENT BOUNDARY.

     Derived from the Implementation-02 FacultyAssignment records and
     nothing else. There is no second Faculty mapping store.

     A mapping is honoured only while its access record is still
     assignable — an expired or emptied record stops carrying content
     for Faculty exactly as it stops carrying it for Students, and the
     reason is reported rather than the row silently vanishing.
     ============================================================ */
  function facultyScope(personId) {
    var p = personById(personId);
    var out = { person: p, mappings: [], experiments: [], courseIds: [], blocked: [] };
    if (!p || p.role !== 'faculty') { return out; }
    var byExp = {};
    var seenCourse = {};
    facultyMappingsFor(personId).forEach(function (m) {
      if (m.tenantId !== p.tenantId) { return; }
      var rec = accessById(m.accessId);
      var reason = accessAssignability(rec, p.tenantId);
      if (reason) { out.blocked.push({ mapping: m, reason: reason }); return; }
      out.mappings.push(m);
      if (!seenCourse[m.courseId]) { seenCourse[m.courseId] = true; out.courseIds.push(m.courseId); }
      /* An Experiment-level mapping carries exactly that Experiment. A
         course-level mapping carries every Experiment the tenant
         actually holds under that record for that Course — never the
         whole canonical course, and never the whole tenant. */
      var ids = m.experimentId
        ? (accessHasExperiment(rec, m.experimentId) ? [m.experimentId] : [])
        : rec.items.map(function (i) { return i.experimentId; }).filter(function (id) {
            var ctx = data.contextOf(id);
            return ctx && ctx.course && ctx.course.id === m.courseId;
          });
      ids.forEach(function (id) {
        if (!byExp[id]) {
          byExp[id] = { experimentId: id, courseId: m.courseId, accessIds: [], mappingIds: [], viaCourse: false };
          out.experiments.push(byExp[id]);
        }
        if (byExp[id].accessIds.indexOf(m.accessId) === -1) { byExp[id].accessIds.push(m.accessId); }
        byExp[id].mappingIds.push(m.id);
        if (!m.experimentId) { byExp[id].viaCourse = true; }
      });
    });
    out.experiments.sort(function (x, y) {
      var cx = data.contextOf(x.experimentId), cy = data.contextOf(y.experimentId);
      var nx = cx ? cx.course.name + ' ' + cx.experiment.name : x.experimentId;
      var ny = cy ? cy.course.name + ' ' + cy.experiment.name : y.experimentId;
      return nx < ny ? -1 : nx > ny ? 1 : 0;
    });
    return out;
  }
  function facultyExperimentIds(personId) {
    return facultyScope(personId).experiments.map(function (r) { return r.experimentId; });
  }

  /* ---- STK31-29 / U-FAC-01 — "Experiments available to their Tenant" ----
     A SECOND, STRICTLY READ-ONLY read model beside `facultyScope`, and
     the distinction between the two is the point: this is what the
     INSTITUTION holds, `facultyScope` is what THIS FACULTY MEMBER
     manages. Nothing here grants anything — a Faculty member cannot
     author an assessment, see a student or open a review for a row that
     is not in their own scope, and every row says which of the two it
     is. Making the tenant's holdings visible answers the question a
     Faculty member could not otherwise answer ("does my institution
     have the AR variant?") without widening any authority by a single
     record; only the Tenant Admin can change a mapping. */
  function facultyTenantHoldings(personId) {
    var p = personById(personId);
    var out = [];
    if (!p || p.role !== 'faculty') { return out; }
    var mine = {};
    facultyScope(personId).experiments.forEach(function (r) { mine[r.experimentId] = true; });
    var seen = {};
    liveAccessForTenant(p.tenantId).forEach(function (rec) {
      if (accessAssignability(rec, p.tenantId)) { return; }
      (rec.items || []).forEach(function (i) {
        var ctx = data.contextOf(i.experimentId);
        if (!ctx) { return; }
        if (!seen[i.experimentId]) {
          seen[i.experimentId] = {
            experimentId: i.experimentId, courseId: ctx.course.id,
            technologies: [], accessIds: [], mapped: !!mine[i.experimentId]
          };
          out.push(seen[i.experimentId]);
        }
        var row = seen[i.experimentId];
        if (row.accessIds.indexOf(rec.id) === -1) { row.accessIds.push(rec.id); }
        (i.technologies || []).forEach(function (t) {
          if (row.technologies.indexOf(t) === -1) { row.technologies.push(t); }
        });
      });
    });
    out.sort(function (x, y) {
      var cx = data.contextOf(x.experimentId), cy = data.contextOf(y.experimentId);
      var nx = cx ? cx.course.name + ' ' + cx.experiment.name : x.experimentId;
      var ny = cy ? cy.course.name + ' ' + cy.experiment.name : y.experimentId;
      return nx < ny ? -1 : nx > ny ? 1 : 0;
    });
    return out;
  }

  /* ---- SUBMITTED WRITTEN ANSWERS WITH NO MAPPED EVALUATOR ----
     A descriptive review is reachable only through a Faculty↔Experiment
     mapping (`reviewsForFaculty` / `facultyCanReview`). Removing the last
     mapping that covers an Experiment therefore made a pending review
     invisible to EVERY Faculty member, while the Student was still being
     told their answer was "with your faculty for review" and could not
     retake. Nothing was destroyed and re-mapping restores the queue in
     one click — but nothing told anybody to. STK31-31 makes Faculty the
     only human evaluator, so a review with no evaluator is a state the
     product has to be able to name. This derivation is what lets it. */
  function pendingReviewsWithoutEvaluator(tenantId) {
    var covered = {};
    facultyForTenant(tenantId).forEach(function (f) {
      facultyExperimentIds(f.id).forEach(function (id) { covered[id] = true; });
      /* A DORMANT MAPPING IS NOT A MISSING ONE. `facultyScope` drops a
         mapping whose access record is expired, empty or out of
         quantity — correctly, because it carries no content while it is
         blocked. But the mapping still exists and names a Faculty
         member, so reporting it as "no mapped evaluator" would send the
         Tenant Admin to make a mapping that is already there. The real
         cause is the access record, which the workspace reports in its
         own right. */
      facultyMappingsFor(f.id).forEach(function (m) {
        if (m.tenantId !== tenantId) { return; }
        if (m.experimentId) { covered[m.experimentId] = true; return; }
        var rec = accessById(m.accessId);
        if (!rec) { return; }
        (rec.items || []).forEach(function (i) {
          var ctx = data.contextOf(i.experimentId);
          if (ctx && ctx.course && ctx.course.id === m.courseId) { covered[i.experimentId] = true; }
        });
      });
    });
    return S.reviews.filter(function (r) {
      return r.tenantId === tenantId && r.status === 'pending' && !covered[r.experimentId];
    });
  }
  /* The same question for one Experiment, asked before a mapping is
     removed so the consequence can be stated rather than discovered. */
  function pendingReviewsLosingEvaluator(mappingId) {
    var m = S.facultyMappings.filter(function (x) { return x.id === mappingId; })[0];
    if (!m || m.status !== 'active') { return []; }
    var stillCovered = {};
    facultyForTenant(m.tenantId).forEach(function (f) {
      facultyMappingsFor(f.id).forEach(function (other) {
        if (other.id === mappingId) { return; }
        var rec = accessById(other.accessId);
        if (accessAssignability(rec, m.tenantId)) { return; }
        var ids = other.experimentId
          ? (accessHasExperiment(rec, other.experimentId) ? [other.experimentId] : [])
          : rec.items.map(function (i) { return i.experimentId; }).filter(function (id) {
              var ctx = data.contextOf(id);
              return ctx && ctx.course && ctx.course.id === other.courseId;
            });
        ids.forEach(function (id) { stillCovered[id] = true; });
      });
    });
    var losing = {};
    var rec = accessById(m.accessId);
    var ids = m.experimentId ? [m.experimentId]
      : (rec ? rec.items.map(function (i) { return i.experimentId; }).filter(function (id) {
          var ctx = data.contextOf(id);
          return ctx && ctx.course && ctx.course.id === m.courseId;
        }) : []);
    ids.forEach(function (id) { if (!stillCovered[id]) { losing[id] = true; } });
    return S.reviews.filter(function (r) {
      return r.tenantId === m.tenantId && r.status === 'pending' && losing[r.experimentId];
    });
  }
  function facultyCanManage(personId, experimentId) {
    return facultyExperimentIds(personId).indexOf(experimentId) !== -1;
  }
  function facultyScopeRow(personId, experimentId) {
    return facultyScope(personId).experiments.filter(function (r) {
      return r.experimentId === experimentId;
    })[0] || null;
  }

  /* STUDENT REACH — brief §9.
     EFFECTIVE ENTITLEMENT ONLY. Not course membership, not group
     membership, not "students at this institution". A student appears
     here only when `entitledStudentsFor` — the Implementation-02
     derivation, allocation gate and all — puts them there.

     ⚠ ACROSS EVERY LIVE ACCESS RECORD THE TENANT HOLDS, not only the one
     the Faculty mapping runs through. The mapping decides WHICH CONTENT
     a Faculty member manages; it does not decide which students count.
     A tenant can hold the same Experiment on two access records, and a
     student entitled through the other one sits the SAME assessment
     (definitions are tenant × Experiment) and appears in the SAME review
     queue (reviews are keyed by Experiment). Intersecting reach with the
     mapping's record made those two disagree: a written answer could
     arrive from a student the progress list said did not exist. */
  function facultyStudentReach(personId, experimentId) {
    var row = facultyScopeRow(personId, experimentId);
    if (!row) { return []; }
    var p = personById(personId);
    if (!p) { return []; }
    var set = {};
    liveAccessForTenant(p.tenantId).forEach(function (rec) {
      entitledStudentsFor(rec.id, experimentId).forEach(function (pid) { set[pid] = true; });
    });
    return Object.keys(set).sort(function (a, b) {
      var pa = personById(a), pb = personById(b);
      var na = pa ? pa.name : a, nb = pb ? pb.name : b;
      return na < nb ? -1 : na > nb ? 1 : 0;
    });
  }
  /* Every student reached by ANY of this Faculty member's experiments. */
  function facultyStudentIds(personId) {
    var set = {};
    facultyExperimentIds(personId).forEach(function (eid) {
      facultyStudentReach(personId, eid).forEach(function (pid) { set[pid] = true; });
    });
    return Object.keys(set);
  }

  /* ============================================================
     QUESTION BANK — Add · Edit · DELETE (STK31-34).

     `Delete` is the user-facing requirement and it is not renamed.
     The MECHANISM underneath is reversible (STK31-22 / ND-15): the item
     leaves the active Question Bank completely and nothing that already
     references it is touched — assessment copies survive, submitted
     attempts survive, completed results survive. The deleted row is
     never surfaced as an archive, a bin or a restore control: to the
     Faculty member it is deleted.
     ============================================================ */

  var QUESTION_TYPES = { mcq: 'Multiple choice', tf: 'True or false', descriptive: 'Descriptive' };

  function questionById(id) {
    return S.questions.filter(function (q) { return q.id === id; })[0] || null;
  }
  function activeQuestion(id) {
    var q = questionById(id);
    return (q && q.status === 'active') ? q : null;
  }
  function questionsForTenant(tenantId) {
    return S.questions.filter(function (q) { return q.tenantId === tenantId && q.status === 'active'; });
  }
  /* The bank a Faculty member may work in: their mapped Experiments,
     and nothing else in the tenant. */
  function questionsForFaculty(personId) {
    var p = personById(personId);
    if (!p) { return []; }
    var allowed = facultyExperimentIds(personId);
    return questionsForTenant(p.tenantId).filter(function (q) {
      return allowed.indexOf(q.experimentId) !== -1;
    });
  }

  function validateQuestion(fields) {
    var errs = [];
    var type = fields.type;
    if (!QUESTION_TYPES[type]) { errs.push({ field: 'q-type', message: 'Choose a question type.' }); }
    if (!String(fields.text || '').trim()) {
      errs.push({ field: 'q-text', message: 'Enter the question text.' });
    }
    if (!fields.experimentId) {
      errs.push({ field: 'q-exp', message: 'Choose the experiment this question belongs to.' });
    }
    var pts = Number(fields.points);
    if (blank(fields.points) || isNaN(pts) || !(pts >= 1) || Math.round(pts) !== pts || pts > 100) {
      errs.push({ field: 'q-points', message: 'Marks must be a whole number between 1 and 100.' });
    }
    if (type === 'mcq') {
      var shape = mcqShape(fields);
      if (shape.options.length < 2) {
        errs.push({ field: 'q-opt-0', message: 'A multiple-choice question needs at least two options.' });
      }
      if (shape.answer === -1) {
        errs.push({ field: 'q-answer', message: shape.options.length && shape.rawAns >= 0
          ? 'The option you marked as correct is empty. Fill it in, or mark a different option.'
          : 'Choose which option is the correct answer.' });
      }
    }
    /* The error field id must be the fieldset the control actually lives
       in. `q-answer` is the MCQ option list; the True/False choice lives
       in `q-tf`, and an error aimed at a hidden fieldset is an error
       nobody ever sees. */
    if (type === 'tf' && fields.answer !== true && fields.answer !== false) {
      errs.push({ field: 'q-tf', message: 'Choose whether the statement is true or false.' });
    }
    return errs;
  }

  /* An MCQ form always renders a fixed number of option rows, so blank
     rows are normal. Dropping them AFTER reading the chosen index would
     silently move the answer key onto a different option, which is the
     one bug in a question editor a Student would eventually feel. The
     index is therefore re-mapped onto the kept options here, once, and
     both validation and the writer use the same mapping. */
  function mcqShape(fields) {
    var raw = (fields.options || []).map(function (o) { return String(o || '').trim(); });
    var keep = [];
    raw.forEach(function (o, i) { if (o !== '') { keep.push(i); } });
    var rawAns = Number(fields.answer);
    return {
      options: keep.map(function (i) { return raw[i]; }),
      answer: keep.indexOf(rawAns),
      rawAns: isNaN(rawAns) ? -1 : rawAns
    };
  }

  function normaliseQuestionFields(fields) {
    var type = fields.type;
    var shape = type === 'mcq' ? mcqShape(fields) : null;
    var opts = shape ? shape.options : [];
    var answer = null;
    if (type === 'mcq') { answer = shape.answer; }
    else if (type === 'tf') { answer = fields.answer === true; }
    return {
      type: type,
      text: String(fields.text || '').trim(),
      options: opts,
      answer: answer,
      points: Number(fields.points) || 1,
      explanation: String(fields.explanation || '').trim(),
      guidance: String(fields.guidance || '').trim(),
      experimentId: fields.experimentId
    };
  }

  function addQuestion(tenantId, fields, facultyPersonId) {
    /* Implementation-06 tenant-plane write guard (STK31-21 / 22). */
    if (!tenantCanWrite(tenantId)) {
      return { ok: false, errors: [{ field: 'q-text', message: 'This institution has been deactivated. No operational action can be taken until it is reactivated.' }], question: null };
    }
    var errs = validateQuestion(fields);
    if (errs.length) { return { ok: false, errors: errs, question: null }; }
    var f = normaliseQuestionFields(fields);
    var ctx = data.contextOf(f.experimentId);
    var now = new Date().toISOString();
    S.seq.question += 1;
    var rec = {
      id: 'QB-' + util.pad3(S.seq.question),
      tenantId: tenantId,
      courseId: ctx && ctx.course ? ctx.course.id : '',
      experimentId: f.experimentId,
      type: f.type, text: f.text, options: f.options, answer: f.answer,
      points: f.points, explanation: f.explanation, guidance: f.guidance,
      status: 'active',
      origin: fields.origin === 'ai' ? 'ai' : 'manual',
      revision: 1,
      createdBy: facultyPersonId || null,
      createdAt: now, updatedAt: now, deletedAt: null
    };
    S.questions.push(rec);
    save();
    return { ok: true, errors: [], question: rec };
  }

  /* EDIT changes the BANK ITEM only.
     It deliberately does NOT reach into an assessment that already
     contains a copy of this question, and it can never reach a
     submitted attempt: the attempt carries its own snapshot. The
     assessment builder is told the bank item moved on and offers an
     explicit "update from the Question Bank" action per question, so
     the change is applied by a decision rather than by a side effect
     (ND-15: never change what sits under a live assessment silently). */
  function updateQuestion(id, fields) {
    var q = activeQuestion(id);
    if (!q) { return { ok: false, errors: [{ field: 'q-text', message: 'This question no longer exists.' }], question: null }; }
    if (!tenantCanWrite(q.tenantId)) {
      return { ok: false, errors: [{ field: 'q-text', message: 'This institution has been deactivated. No operational action can be taken until it is reactivated.' }], question: null };
    }
    var merged = {
      type: fields.type || q.type,
      text: fields.text, options: fields.options, answer: fields.answer,
      points: fields.points, explanation: fields.explanation, guidance: fields.guidance,
      experimentId: fields.experimentId || q.experimentId
    };
    var errs = validateQuestion(merged);
    if (errs.length) { return { ok: false, errors: errs, question: null }; }
    var f = normaliseQuestionFields(merged);
    var ctx = data.contextOf(f.experimentId);
    q.type = f.type; q.text = f.text; q.options = f.options; q.answer = f.answer;
    q.points = f.points; q.explanation = f.explanation; q.guidance = f.guidance;
    q.experimentId = f.experimentId;
    q.courseId = ctx && ctx.course ? ctx.course.id : '';
    q.revision += 1;
    q.updatedAt = new Date().toISOString();
    save();
    return { ok: true, errors: [], question: q };
  }

  /* Where a Question Bank item is currently used — shown BEFORE
     deleting, so the consequence is stated rather than discovered. */
  function questionUsage(id) {
    var out = { assessments: [], attempts: 0 };
    S.assessmentDefs.forEach(function (d) {
      if (d.status !== 'active') { return; }
      if (d.questions.some(function (q) { return q.bankQuestionId === id; })) { out.assessments.push(d); }
    });
    S.attempts.forEach(function (a) {
      if (!a.snapshot) { return; }
      if (a.snapshot.questions.some(function (q) { return q.bankQuestionId === id; })) { out.attempts += 1; }
    });
    return out;
  }

  function deleteQuestion(id) {
    var q = activeQuestion(id);
    if (!q) { return false; }
    if (!tenantCanWrite(q.tenantId)) { return false; }
    q.status = 'deleted';
    q.deletedAt = new Date().toISOString();
    save();
    return true;
  }

  /* ============================================================
     ASSESSMENT DEFINITIONS — Faculty-owned, one per Experiment.

     `data.ASSESSMENTS` is a SEED SOURCE, not a runtime source. Both the
     Faculty workspace and the Student workspace read the definition
     below, so there is exactly one assessment and the two roles cannot
     drift apart.
     ============================================================ */

  function assessmentDefById(id) {
    return S.assessmentDefs.filter(function (d) { return d.id === id; })[0] || null;
  }
  function assessmentForTenant(tenantId, experimentId) {
    return S.assessmentDefs.filter(function (d) {
      return d.tenantId === tenantId && d.experimentId === experimentId && d.status === 'active';
    })[0] || null;
  }
  function assessmentForStudent(personId, experimentId) {
    var p = personById(personId);
    if (!p) { return null; }
    return assessmentForTenant(p.tenantId, experimentId);
  }
  function assessmentDefsForTenant(tenantId) {
    return S.assessmentDefs.filter(function (d) { return d.tenantId === tenantId && d.status === 'active'; });
  }

  /* The attempt's own copy always wins. A definition is consulted only
     for an attempt written before snapshots existed AND whose migration
     could not find a source — which the migration above makes
     unreachable in practice, and which is handled rather than crashing
     if it ever is. */
  function attemptAssessment(attempt) {
    if (!attempt) { return null; }
    if (attempt.snapshot) { return attempt.snapshot; }
    var d = assessmentDefById(attempt.assessmentId);
    if (d) { return snapshotOfDefinition(d); }
    return assessmentForStudent(attempt.personId, attempt.experimentId);
  }
  function snapshotOfDefinition(def) {
    return {
      assessmentId: def.id,
      revision: def.revision || 1,
      title: def.title,
      intro: def.intro,
      passMark: def.passMark,
      attemptLimit: def.attemptLimit,
      /* The visibility policy is deliberately NOT frozen here — see
         `releaseFor` below. */
      questions: (def.questions || []).map(function (q) {
        return {
          id: q.id, bankQuestionId: q.bankQuestionId || null,
          type: q.type, text: q.text,
          options: (q.options || []).slice(),
          answer: q.answer,
          points: q.points || 1,
          explanation: q.explanation || '',
          guidance: q.guidance || ''
        };
      })
    };
  }

  /* ---------- WHICH VALUES ARE HISTORICAL AND WHICH ARE LIVE ----------
     A JUDGEMENT CALL, recorded in the README.

     HISTORICAL (from the attempt snapshot): the questions, the options,
     the answer key, the marks and the pass mark. These decided a result
     that has already been given. Re-scoring a submitted attempt because
     Faculty later reworded a question or moved the pass mark would
     rewrite a Student's history, and no source asks for a regrade.

     LIVE (from the current definition): the answer / explanation
     VISIBILITY POLICY, and the attempt limit. Both are Faculty
     decisions about what happens NEXT, and §19 requires the Faculty
     control to drive the same Student result engine — a policy change
     that could not reach an existing result would not be that control
     at all. */
  function releaseFor(attempt) {
    var live = assessmentForStudent(attempt.personId, attempt.experimentId);
    if (live) { return assessmentRelease(live); }
    return assessmentRelease(attemptAssessment(attempt));
  }

  /* ---------- READINESS IS DERIVED, NEVER STORED ----------
     Batch 02 derived an assessment's status from its content and its
     configuration rather than storing a lifecycle column, and the
     31 Aug review changed nothing about that. The same three-part
     completeness model is kept here, and it is the ONLY thing the
     builder rail and the list badge read.

     ⚠ No publish, approve, release or activate step exists or may be
     added: an assessment is usable exactly when it has questions and a
     complete configuration. */
  function assessmentReadiness(def) {
    var out = {
      hasQuestions: false, settingsComplete: false, contextBound: false,
      ready: false, label: 'Draft', missing: []
    };
    if (!def) { return out; }
    out.hasQuestions = (def.questions || []).length > 0;
    if (!out.hasQuestions) { out.missing.push('no questions have been selected'); }

    var pol = def.policy || {};
    var policyOk = pol.mode === 'SHOW_IMMEDIATELY' ||
      (pol.mode === 'AFTER_DEADLINE' && !!def.deadline) ||
      (pol.mode === 'CUSTOM_DATE' && !!pol.date);
    var settingsOk = !!String(def.title || '').replace(/^\s+|\s+$/g, '') &&
      typeof def.passMark === 'number' && def.passMark >= 0 && def.passMark <= 100 &&
      typeof def.attemptLimit === 'number' && def.attemptLimit >= 1 &&
      policyOk;
    out.settingsComplete = settingsOk;
    if (!settingsOk) {
      out.missing.push(policyOk
        ? 'the settings are incomplete'
        : 'the answer visibility policy has no date to release on');
    }
    out.contextBound = !!data.contextOf(def.experimentId);
    if (!out.contextBound) { out.missing.push('it is not bound to an experiment'); }

    out.ready = out.hasQuestions && out.settingsComplete && out.contextBound;
    out.label = out.ready ? 'Ready for students'
      : (out.hasQuestions || out.settingsComplete) ? 'Incomplete' : 'Draft';
    return out;
  }

  function assessmentTotals(asm) {
    var out = { objective: 0, descriptive: 0, total: 0, count: 0, mcq: 0, tf: 0, desc: 0 };
    if (!asm) { return out; }
    (asm.questions || []).forEach(function (q) {
      var pts = q.points || 1;
      out.count += 1;
      out.total += pts;
      if (q.type === 'descriptive') { out.descriptive += pts; out.desc += 1; }
      else { out.objective += pts; if (q.type === 'mcq') { out.mcq += 1; } else { out.tf += 1; } }
    });
    return out;
  }

  /* Submitted attempts against an Experiment's assessment. This is the
     number that makes an edit a REVISION rather than a plain save. */
  function assessmentAttemptStats(tenantId, experimentId) {
    var subs = 0, open = 0;
    S.attempts.forEach(function (a) {
      if (a.tenantId !== tenantId || a.experimentId !== experimentId) { return; }
      if (a.status === ATTEMPT_STATUS.SUBMITTED) { subs += 1; }
      else { open += 1; }
    });
    return { submitted: subs, inProgress: open };
  }

  /* `Number('')` is 0, and 0 is a legal pass mark — so an EMPTY field would
     have validated as "pass at 0%", which every attempt passes. A blank
     numeric field is refused explicitly rather than coerced. */
  function blank(value) {
    return value === '' || value === null || value === undefined;
  }

  function validateAssessmentSettings(fields) {
    var errs = [];
    if (!String(fields.title || '').trim()) {
      errs.push({ field: 'as-title', message: 'Enter a name for the assessment.' });
    }
    var pass = Number(fields.passMark);
    if (blank(fields.passMark) || isNaN(pass) || !(pass >= 0) || !(pass <= 100) || Math.round(pass) !== pass) {
      errs.push({ field: 'as-pass', message: 'Enter a pass mark — a whole number between 0 and 100.' });
    }
    var lim = Number(fields.attemptLimit);
    if (blank(fields.attemptLimit) || isNaN(lim) || !(lim >= 1) || !(lim <= 20) || Math.round(lim) !== lim) {
      errs.push({ field: 'as-limit', message: 'Enter how many attempts are allowed — a whole number between 1 and 20.' });
    }
    if (!data.POLICY_MODES[fields.policyMode]) {
      errs.push({ field: 'as-policy', message: 'Choose when answers and explanations become visible.' });
    }
    if (fields.policyMode === 'AFTER_DEADLINE' && !fields.deadline) {
      errs.push({ field: 'as-deadline', message: 'Set the assessment deadline that answers are released after.' });
    }
    if (fields.policyMode === 'CUSTOM_DATE' && !fields.customDate) {
      errs.push({ field: 'as-date', message: 'Set the date answers and explanations become visible.' });
    }
    if (fields.deadline && isNaN(new Date(fields.deadline).getTime())) {
      errs.push({ field: 'as-deadline', message: 'Enter a valid deadline date.' });
    }
    if (fields.customDate && isNaN(new Date(fields.customDate).getTime())) {
      errs.push({ field: 'as-date', message: 'Enter a valid release date.' });
    }
    return errs;
  }

  /* End-of-day, so a deadline of "today" has not already passed. */
  function endOfDay(dateStr) {
    if (!dateStr) { return null; }
    var d = new Date(dateStr + 'T23:59:59');
    if (isNaN(d.getTime())) {
      d = new Date(dateStr);
      if (isNaN(d.getTime())) { return null; }
    }
    return d.toISOString();
  }

  function applySettings(def, fields) {
    def.title = String(fields.title || '').trim();
    def.intro = String(fields.intro || '').trim();
    def.passMark = Number(fields.passMark);
    def.attemptLimit = Number(fields.attemptLimit);
    def.deadline = fields.deadline ? endOfDay(fields.deadline) : null;
    def.policy = fields.policyMode === 'CUSTOM_DATE'
      ? { mode: 'CUSTOM_DATE', date: endOfDay(fields.customDate) }
      : { mode: fields.policyMode };
  }

  function createAssessment(tenantId, experimentId, facultyPersonId, fields) {
    /* Implementation-06 tenant-plane write guard (STK31-21 / 22). */
    if (!tenantCanWrite(tenantId)) {
      return { ok: false, errors: [{ field: 'as-title', message: 'This institution has been deactivated. No operational action can be taken until it is reactivated.' }], def: null };
    }
    if (assessmentForTenant(tenantId, experimentId)) {
      return { ok: false, errors: [{ field: 'as-title', message: 'This experiment already has an assessment.' }], def: null };
    }
    var errs = validateAssessmentSettings(fields);
    if (errs.length) { return { ok: false, errors: errs, def: null }; }
    var now = new Date().toISOString();
    S.seq.assessmentDef += 1;
    var def = {
      id: 'ADEF-' + util.pad3(S.seq.assessmentDef),
      tenantId: tenantId, experimentId: experimentId,
      title: '', intro: '', passMark: 60, attemptLimit: 3,
      deadline: null, policy: { mode: 'SHOW_IMMEDIATELY' },
      questions: [],
      status: 'active', revision: 1, origin: 'faculty', derivedFrom: null,
      createdBy: facultyPersonId || null, updatedBy: facultyPersonId || null,
      createdAt: now, updatedAt: now, revisedAt: null
    };
    applySettings(def, fields);
    S.assessmentDefs.push(def);
    save();
    return { ok: true, errors: [], def: def };
  }

  function updateAssessmentSettings(defId, fields, facultyPersonId) {
    var def = assessmentDefById(defId);
    if (!def || def.status !== 'active') {
      return { ok: false, errors: [{ field: 'as-title', message: 'This assessment no longer exists.' }], def: null };
    }
    if (!tenantCanWrite(def.tenantId)) {
      return { ok: false, errors: [{ field: 'as-title', message: 'This institution has been deactivated. No operational action can be taken until it is reactivated.' }], def: null };
    }
    var errs = validateAssessmentSettings(fields);
    if (errs.length) { return { ok: false, errors: errs, def: null }; }
    applySettings(def, fields);
    def.updatedBy = facultyPersonId || null;
    def.updatedAt = new Date().toISOString();
    save();
    return { ok: true, errors: [], def: def };
  }

  /* ---------- STRUCTURAL CHANGE = A NEW REVISION (brief §39) ----------
     Adding, removing, reordering or refreshing a question changes what
     a future attempt will be answering. Once submitted attempts exist,
     that is a NEW REVISION of the assessment: the revision number
     advances and the change applies to attempts started from now on.
     Every submitted attempt keeps the snapshot it was taken against, so
     no history is invalidated and no version-management UI is needed. */
  function bumpRevision(def, facultyPersonId) {
    var stats = assessmentAttemptStats(def.tenantId, def.experimentId);
    def.updatedBy = facultyPersonId || null;
    def.updatedAt = new Date().toISOString();
    if (stats.submitted > 0) {
      def.revision = (def.revision || 1) + 1;
      def.revisedAt = def.updatedAt;
      return true;
    }
    return false;
  }

  function addQuestionsToAssessment(defId, bankIds, facultyPersonId) {
    var def = assessmentDefById(defId);
    if (!def || def.status !== 'active') { return { ok: false, added: 0, revised: false }; }
    if (!tenantCanWrite(def.tenantId)) { return { ok: false, added: 0, revised: false }; }
    var present = {};
    def.questions.forEach(function (q) { if (q.bankQuestionId) { present[q.bankQuestionId] = true; } });
    var added = 0;
    (bankIds || []).forEach(function (id) {
      if (present[id]) { return; }
      var bank = activeQuestion(id);
      if (!bank || bank.tenantId !== def.tenantId) { return; }
      def.questions.push(copyBankQuestion(bank));
      present[id] = true;
      added += 1;
    });
    if (!added) { return { ok: false, added: 0, revised: false }; }
    var revised = bumpRevision(def, facultyPersonId);
    save();
    return { ok: true, added: added, revised: revised };
  }

  /* REMOVE FROM THIS ASSESSMENT — a different action from Delete from
     the Question Bank (brief §17). The bank item is untouched. */
  function removeQuestionFromAssessment(defId, questionId, facultyPersonId) {
    var def = assessmentDefById(defId);
    if (!def || def.status !== 'active') { return { ok: false, revised: false }; }
    if (!tenantCanWrite(def.tenantId)) { return { ok: false, revised: false }; }
    var before = def.questions.length;
    def.questions = def.questions.filter(function (q) { return q.id !== questionId; });
    if (def.questions.length === before) { return { ok: false, revised: false }; }
    var revised = bumpRevision(def, facultyPersonId);
    save();
    return { ok: true, revised: revised };
  }

  function moveAssessmentQuestion(defId, questionId, direction, facultyPersonId) {
    var def = assessmentDefById(defId);
    if (!def || def.status !== 'active') { return { ok: false, revised: false }; }
    if (!tenantCanWrite(def.tenantId)) { return { ok: false, revised: false }; }
    var idx = -1;
    def.questions.forEach(function (q, i) { if (q.id === questionId) { idx = i; } });
    var to = idx + (direction === 'up' ? -1 : 1);
    if (idx === -1 || to < 0 || to >= def.questions.length) { return { ok: false, revised: false }; }
    var moved = def.questions.splice(idx, 1)[0];
    def.questions.splice(to, 0, moved);
    var revised = bumpRevision(def, facultyPersonId);
    save();
    return { ok: true, revised: revised };
  }

  /* Whether an assessment's copy of a question has fallen behind the
     Question Bank item it came from, or whether that item has been
     deleted. Reported, never applied automatically. */
  function assessmentQuestionLink(q) {
    if (!q.bankQuestionId) { return { linked: false, state: 'unlinked' }; }
    var bank = questionById(q.bankQuestionId);
    if (!bank) { return { linked: false, state: 'unlinked' }; }
    if (bank.status !== 'active') { return { linked: true, bank: bank, state: 'deleted' }; }
    if ((bank.revision || 1) !== (q.bankRevision || 1)) { return { linked: true, bank: bank, state: 'updated' }; }
    return { linked: true, bank: bank, state: 'current' };
  }
  function refreshAssessmentQuestion(defId, questionId, facultyPersonId) {
    var def = assessmentDefById(defId);
    if (!def || def.status !== 'active') { return { ok: false, revised: false }; }
    if (!tenantCanWrite(def.tenantId)) { return { ok: false, revised: false }; }
    var target = def.questions.filter(function (q) { return q.id === questionId; })[0];
    if (!target) { return { ok: false, revised: false }; }
    var link = assessmentQuestionLink(target);
    if (link.state !== 'updated') { return { ok: false, revised: false }; }
    var bank = link.bank;
    target.type = bank.type;
    target.text = bank.text;
    target.options = (bank.options || []).slice();
    target.answer = bank.answer;
    target.points = bank.points || 1;
    target.explanation = bank.explanation || '';
    target.guidance = bank.guidance || '';
    target.bankRevision = bank.revision;
    var revised = bumpRevision(def, facultyPersonId);
    save();
    return { ok: true, revised: revised };
  }

  /* ============================================================
     DESCRIPTIVE REVIEW — FACULTY IS THE ONLY HUMAN EVALUATOR
     (STK31-31).

     No other role can reach these functions, and nothing here
     finalises a review on its own. An assistance suggestion is a
     suggestion: `finaliseReview` is the ONLY writer of an evaluated
     result, and only a Faculty member calls it.
     ============================================================ */

  function reviewById(id) {
    return S.reviews.filter(function (r) { return r.id === id; })[0] || null;
  }
  function reviewsForAttempt(attemptId) {
    return S.reviews.filter(function (r) { return r.attemptId === attemptId; });
  }
  function attemptReviewState(attemptId) {
    var revs = reviewsForAttempt(attemptId);
    var done = revs.filter(function (r) { return r.status === 'completed'; }).length;
    return { total: revs.length, completed: done, pending: revs.length - done };
  }
  /* The queue, bounded by the Faculty content boundary. A review for an
     Experiment this Faculty member is not mapped to is not in their
     queue and cannot be opened by them (brief §24). */
  function reviewsForFaculty(personId, opts) {
    opts = opts || {};
    var p = personById(personId);
    if (!p || p.role !== 'faculty') { return []; }
    var allowed = facultyExperimentIds(personId);
    return S.reviews.filter(function (r) {
      if (r.tenantId !== p.tenantId) { return false; }
      if (allowed.indexOf(r.experimentId) === -1) { return false; }
      /* A review only exists for a real submitted attempt. */
      var att = attemptById(r.attemptId);
      if (!att || att.status !== ATTEMPT_STATUS.SUBMITTED) { return false; }
      if (opts.experimentId && r.experimentId !== opts.experimentId) { return false; }
      if (opts.status && r.status !== opts.status) { return false; }
      return true;
    }).sort(function (a, b) {
      /* Oldest waiting first — the only ordering the data supports. */
      if (a.status !== b.status) { return a.status === 'pending' ? -1 : 1; }
      return (a.createdAt || '') < (b.createdAt || '') ? -1 : 1;
    });
  }
  function facultyCanReview(personId, review) {
    var p = personById(personId);
    if (!p || p.role !== 'faculty' || !review) { return false; }
    if (review.tenantId !== p.tenantId) { return false; }
    return facultyCanManage(personId, review.experimentId);
  }
  function reviewQuestion(review) {
    var att = attemptById(review.attemptId);
    var asm = attemptAssessment(att);
    if (!asm) { return null; }
    return asm.questions.filter(function (q) { return q.id === review.questionId; })[0] || null;
  }
  function reviewAnswer(review) {
    var att = attemptById(review.attemptId);
    if (!att) { return ''; }
    var v = att.answers[review.questionId];
    return (v === undefined || v === null) ? '' : String(v);
  }

  /* AI-ASSISTED SUGGESTION — prototype, local, deterministic.
     It writes a SUGGESTION onto the review record and nothing else. The
     review stays `pending`, the attempt keeps its pending outcome, and
     the Student sees no change. Only `finaliseReview` produces a
     result. */
  function generateReviewAssistance(reviewId) {
    var r = reviewById(reviewId);
    if (!r || r.status !== 'pending') { return null; }
    if (!tenantCanWrite(r.tenantId)) { return null; }
    var q = reviewQuestion(r);
    var suggestion = XRSLP.assist.reviewSuggestion({
      answer: reviewAnswer(r),
      maxMarks: r.maxMarks,
      question: q
    });
    r.assistance = {
      suggestedMarks: suggestion.marks,
      suggestedFeedback: suggestion.feedback,
      /* The short, Faculty-facing observations the figure came from.
         Earlier builds also stored a long `rationale` paragraph; that
         account of what ND-09 leaves unspecified is documentation, not
         product copy, and is no longer written or read. A record saved
         by such a build keeps its extra field harmlessly — the screen
         reads `reasons` and falls back to the old `signals`. */
      reasons: suggestion.reasons,
      generatedAt: new Date().toISOString(),
      accepted: false
    };
    /* PERSISTED ON PURPOSE, and only as DATA. `accepted` is stamped by
       `finaliseReview`, so a completed review can always say whether a
       suggestion was used — that audit trail has to outlive the tab.
       Whether the suggestion PANEL is on screen is a separate, purely
       transient thing the review screen owns; it is deliberately not
       stored here, so a reload cannot reopen a panel nobody asked for. */
    save();
    return r.assistance;
  }

  /* THE ONE WRITER OF AN EVALUATED DESCRIPTIVE RESULT. */
  function finaliseReview(reviewId, marks, feedback, facultyPersonId, usedAssistance) {
    var r = reviewById(reviewId);
    if (!r) { return { ok: false, errors: [{ field: 'rv-marks', message: 'This response no longer exists.' }] }; }
    if (!tenantCanWrite(r.tenantId)) {
      return { ok: false, errors: [{ field: 'rv-marks', message: 'This institution has been deactivated. No operational action can be taken until it is reactivated.' }] };
    }
    if (r.status === 'completed') {
      return { ok: false, errors: [{ field: 'rv-marks', message: 'This response has already been reviewed.' }] };
    }
    if (!facultyCanReview(facultyPersonId, r)) {
      return { ok: false, errors: [{ field: 'rv-marks', message: 'This response is outside your mapped content.' }] };
    }
    var errs = [];
    var m = Number(marks);
    if (marks === '' || marks === null || marks === undefined || isNaN(m)) {
      errs.push({ field: 'rv-marks', message: 'Enter the marks awarded.' });
    } else if (m < 0) {
      errs.push({ field: 'rv-marks', message: 'Marks cannot be negative.' });
    } else if (m > r.maxMarks) {
      errs.push({ field: 'rv-marks', message: 'Marks cannot be more than the maximum of ' + r.maxMarks + '.' });
    } else if (Math.round(m * 2) !== m * 2) {
      errs.push({ field: 'rv-marks', message: 'Enter whole or half marks.' });
    }
    if (errs.length) { return { ok: false, errors: errs }; }
    r.status = 'completed';
    r.marks = m;
    r.feedback = String(feedback || '').trim();
    r.reviewedBy = facultyPersonId;
    r.reviewedAt = new Date().toISOString();
    if (r.assistance) { r.assistance.accepted = !!usedAssistance; }
    /* The Student result engine recomputes from the marks that now
       exist. Nothing is duplicated into a Faculty-only result. */
    var att = attemptById(r.attemptId);
    if (att) { recomputeAttempt(att); }
    save();
    return { ok: true, errors: [], review: r };
  }

  /* ============================================================
     FACULTY ANALYTICS — every figure derived from real records.

     Each number below states its own numerator and denominator, and no
     composite index, score, rank or prediction exists anywhere
     (PM-11 / STK31-29).

     ⚠ `completed` inherits the PROTOTYPE-DERIVED COMPLETION RULE from
     `experimentProgress`. It is not a stakeholder-confirmed academic
     completion policy, and every surface that shows it says so.
     ============================================================ */
  function facultyExperimentStats(personId, experimentId) {
    var reach = facultyStudentReach(personId, experimentId);
    var p = personById(personId);
    var tenantId = p ? p.tenantId : null;
    var out = {
      experimentId: experimentId,
      reach: reach.length,
      notStarted: 0, inProgress: 0, awaitingReview: 0, completed: 0,
      technologies: {},
      assessment: assessmentForTenant(tenantId, experimentId),
      submitted: 0, passed: 0, notPassed: 0, pendingReview: 0,
      pendingReviewResponses: 0,
      resourceTotal: data.resourcesFor(experimentId).length,
      resourcesComplete: 0,
      rows: []
    };
    reach.forEach(function (pid) {
      var techs = studentEntitledTechnologies(pid, experimentId);
      var prog = experimentProgress(pid, experimentId, techs);
      out.rows.push({ personId: pid, technologies: techs, progress: prog });
      if (prog.status === TECH_PROGRESS.COMPLETED) { out.completed += 1; }
      else if (prog.status === TECH_PROGRESS.PENDING_REVIEW) { out.awaitingReview += 1; }
      else if (prog.status === TECH_PROGRESS.IN_PROGRESS) { out.inProgress += 1; }
      else { out.notStarted += 1; }

      var res = resourceProgress(pid, experimentId);
      if (res.total > 0 && res.completed === res.total) { out.resourcesComplete += 1; }

      /* TECHNOLOGY FIGURES STAY TECHNOLOGY-SPECIFIC (brief §35). Only
         SimulationActivity contributes: an Experiment-level assessment
         submission must never make a technology look started. */
      techs.forEach(function (t) {
        if (!out.technologies[t]) { out.technologies[t] = { entitled: 0, started: 0, completed: 0 }; }
        out.technologies[t].entitled += 1;
        var st = simulationStatus(pid, experimentId, t);
        if (st === SIM_STATUS.IN_PROGRESS || st === SIM_STATUS.COMPLETED) { out.technologies[t].started += 1; }
        if (st === SIM_STATUS.COMPLETED) { out.technologies[t].completed += 1; }
      });

      var last = latestSubmittedAttempt(pid, experimentId);
      if (last) {
        out.submitted += 1;
        if (last.outcome === OUTCOME.PASSED) { out.passed += 1; }
        else if (last.outcome === OUTCOME.NOT_PASSED) { out.notPassed += 1; }
        else { out.pendingReview += 1; }
      }
    });
    out.pendingReviewResponses = reviewsForFaculty(personId, {
      experimentId: experimentId, status: 'pending'
    }).length;
    return out;
  }

  function facultyOverview(personId) {
    var scope = facultyScope(personId);
    var out = {
      scope: scope,
      courses: scope.courseIds.length,
      experiments: scope.experiments.length,
      assessments: 0,
      experimentsWithoutAssessment: [],
      assessmentsWithoutQuestions: [],
      students: facultyStudentIds(personId).length,
      pendingReviews: reviewsForFaculty(personId, { status: 'pending' }).length,
      notStarted: 0, inProgress: 0, awaitingReview: 0, completed: 0,
      submitted: 0,
      stats: []
    };
    var p = personById(personId);
    scope.experiments.forEach(function (row) {
      var st = facultyExperimentStats(personId, row.experimentId);
      out.stats.push(st);
      var def = p ? assessmentForTenant(p.tenantId, row.experimentId) : null;
      if (def) {
        out.assessments += 1;
        if (!def.questions.length) { out.assessmentsWithoutQuestions.push(def); }
      } else {
        out.experimentsWithoutAssessment.push(row.experimentId);
      }
      out.notStarted += st.notStarted;
      out.inProgress += st.inProgress;
      out.awaitingReview += st.awaitingReview;
      out.completed += st.completed;
      out.submitted += st.submitted;
    });
    return out;
  }

  /* ============================================================
     IMPLEMENTATION 06 — SUPER ADMIN GOVERNANCE AND B2B OPERATIONS

     Six capability areas, all of them extensions of the records that
     already exist. Nothing here introduces a second copy of a concept
     the earlier slices already own.

       1 · tenant governance          deactivate / reactivate  STK31-21 · 22
       2 · Tenant Admin assignment                             STK31-21
       3 · platform role governance   Vendor · Reviewer · CM    STK31-41
       4 · canonical/master metadata  (shared with the CM)      STK31-09
       5 · later-version Release / Hold                        STK31-07
       6 · device transfer · support · the 15-day reminder     STK31-38 · 39 · 28

     ── THE ALTITUDE RULE, RESTATED ──────────────────────────────
     Super Admin decides WHAT A TENANT MAY USE. The Tenant Admin
     decides WHICH LEARNER GETS WHAT. Nothing in this section grants a
     learner entitlement, consumes a licence, or creates an assignment.
     Releasing a version, assigning a role, approving a device transfer
     and resolving a support ticket all leave `access[]`, `assignments[]`
     and the derived entitlement engine completely untouched.
     ============================================================ */

  /* ---------- tenant governance ---------- */

  /* A tenant with no explicit status is ACTIVE. Every tenant written by
     an Implementation 01–05 build is therefore active without being
     rewritten. */
  function tenantIsActive(tenantId) {
    var t = tenantById(tenantId);
    return !!t && t.status !== 'inactive';
  }
  function tenantStatusMeta(t) {
    return (t && t.status === 'inactive')
      ? { key: 'inactive', label: 'Deactivated', badge: 'b-danger', icon: 'alertCirc' }
      : { key: 'active', label: 'Active', badge: 'b-success', icon: 'check' };
  }

  function pushTenantEvent(t, kind, label, actor, note) {
    if (!Array.isArray(t.history)) { t.history = []; }
    S.seq.event += 1;
    t.history.push({
      seq: S.seq.event, kind: kind, label: label,
      who: actor || 'Super Admin', at: new Date().toISOString(),
      note: String(note || '').trim()
    });
    return t.history[t.history.length - 1];
  }

  /* Reversible by construction (STK31-22): a status flip and a history
     entry, and NOT ONE record removed. Assignments, allocations,
     attempts, reviews, questions and access records are all left exactly
     as they stand — which is the only reason reactivation can restore
     the previous state rather than approximate it. */
  function deactivateTenant(tenantId, reason) {
    var t = tenantById(tenantId);
    if (!t || t.status === 'inactive') { return null; }
    t.status = 'inactive';
    t.deactivatedAt = new Date().toISOString();
    t.deactivatedReason = String(reason || '').trim();
    pushTenantEvent(t, 'deactivated', 'Tenant deactivated', 'Super Admin', t.deactivatedReason);
    save();
    return t;
  }
  function reactivateTenant(tenantId, reason) {
    var t = tenantById(tenantId);
    if (!t || t.status !== 'inactive') { return null; }
    t.status = 'active';
    t.reactivatedAt = new Date().toISOString();
    t.deactivatedReason = '';
    pushTenantEvent(t, 'reactivated', 'Tenant reactivated', 'Super Admin', String(reason || '').trim());
    save();
    return t;
  }

  /* THE ONE TENANT-PLANE WRITE GUARD.

     Every mutating tenant-plane action — Tenant Admin provisioning,
     Faculty authoring, Student learning — asks this and nothing else, so
     a deactivated tenant cannot be operated on through a screen, a
     hand-typed route, or a second call path that forgot to check.

     Reporting a technical issue is deliberately NOT gated by it: "our
     access stopped working" is exactly the report a user needs to be
     able to file, and a support ticket changes no entitlement. */
  function tenantWriteBlock(tenantId) {
    if (!tenantId) { return null; }
    return tenantIsActive(tenantId) ? null : 'tenant-inactive';
  }
  function tenantCanWrite(tenantId) { return tenantWriteBlock(tenantId) === null; }
  function personCanWrite(personId) {
    var p = personById(personId);
    return !!p && tenantCanWrite(p.tenantId);
  }
  var TENANT_INACTIVE_TEXT =
    'This institution has been deactivated by the Super Admin. Existing people, groups, mappings, ' +
    'assignments and learning records are all preserved, and nothing has been deleted — but no ' +
    'operational action can be taken until the institution is reactivated.';

  /* ---------- Tenant Admin assignment (STK31-21) ---------- */

  function tenantAdmins() { return S.tenantAdmins; }
  function tenantAdminById(id) {
    return S.tenantAdmins.filter(function (a) { return a.id === id; })[0] || null;
  }
  function tenantAdminsFor(tenantId) {
    return S.tenantAdmins.filter(function (a) {
      return a.tenantId === tenantId && a.status === 'active';
    });
  }
  function allTenantAdminsFor(tenantId) {
    return S.tenantAdmins.filter(function (a) { return a.tenantId === tenantId; });
  }
  function tenantsWithoutAdmin() {
    return S.tenants.filter(function (t) { return !tenantAdminsFor(t.id).length; });
  }
  function validateTenantAdmin(tenantId, fields) {
    var errs = [];
    var name = String(fields.name || '').trim();
    var email = String(fields.email || '').trim();
    if (!name) { errs.push({ field: 'ta-name', message: 'Enter the name of the person to assign.' }); }
    if (!email) { errs.push({ field: 'ta-email', message: 'Enter a contact email address.' }); }
    else if (!util.isEmail(email)) { errs.push({ field: 'ta-email', message: 'Enter a valid email address.' }); }
    else if (tenantAdminsFor(tenantId).some(function (a) {
      return a.email.toLowerCase() === email.toLowerCase();
    })) {
      errs.push({ field: 'ta-email', message: 'This person is already the Tenant Admin for this institution.' });
    }
    return errs;
  }
  /* No account, no invitation, no credential. QD-02 answers WHO assigns,
     not how an identity first exists (FRD 7.4.2 / 8.3 are Phase 3), so
     this records the assignment against a named person and invents no
     mechanism behind it. */
  function assignTenantAdmin(tenantId, fields) {
    var t = tenantById(tenantId);
    if (!t) { return { ok: false, errors: [{ field: 'ta-name', message: 'This institution no longer exists.' }], admin: null }; }
    var errs = validateTenantAdmin(tenantId, fields);
    if (errs.length) { return { ok: false, errors: errs, admin: null }; }
    var now = new Date().toISOString();
    S.seq.tenantAdmin += 1;
    var rec = {
      id: 'TAD-' + util.pad3(S.seq.tenantAdmin),
      tenantId: tenantId,
      name: String(fields.name || '').trim(),
      email: String(fields.email || '').trim(),
      status: 'active',
      source: 'manual',
      assignedBy: 'Super Admin',
      assignedAt: now,
      removedBy: null, removedAt: null
    };
    S.tenantAdmins.push(rec);
    pushTenantEvent(t, 'admin-assigned', 'Tenant Admin assigned — ' + rec.name, 'Super Admin', '');
    save();
    return { ok: true, errors: [], admin: rec };
  }
  /* Reversible, like every other governance removal here. */
  function removeTenantAdmin(id) {
    var rec = tenantAdminById(id);
    if (!rec || rec.status !== 'active') { return null; }
    rec.status = 'removed';
    rec.removedBy = 'Super Admin';
    rec.removedAt = new Date().toISOString();
    var t = tenantById(rec.tenantId);
    if (t) { pushTenantEvent(t, 'admin-removed', 'Tenant Admin removed — ' + rec.name, 'Super Admin', ''); }
    if (S.protoTenantAdminId === id) { S.protoTenantAdminId = null; }
    save();
    return rec;
  }

  /* PROTOTYPE-ONLY Tenant Admin selection — the same pattern as the
     Student, Faculty and content-actor pointers. It is not
     authentication and grants nothing. Its ONE real job is the scope
     rule: an admin assigned to one tenant is never resolved as the
     administrator of another. */
  function protoTenantAdminId() { return S.protoTenantAdminId || null; }
  function setProtoTenantAdmin(id) {
    S.protoTenantAdminId = id || null;
    save();
    return S.protoTenantAdminId;
  }
  function protoTenantAdmin() {
    var a = S.protoTenantAdminId ? tenantAdminById(S.protoTenantAdminId) : null;
    return (a && a.status === 'active') ? a : null;
  }
  /* Who is administering THIS tenant. The pointer is honoured only when
     it names an active admin OF THIS TENANT; otherwise the tenant's own
     first assigned admin answers, and a tenant with none answers null. */
  function actingTenantAdmin(tenantId) {
    var chosen = protoTenantAdmin();
    if (chosen && chosen.tenantId === tenantId) { return chosen; }
    return tenantAdminsFor(tenantId)[0] || null;
  }

  /* ---------- platform actor registration (Implementation 07.1) ----------

     WHAT THIS IS, AND WHAT IT DELIBERATELY IS NOT.

     `QD-02` is answered only for WHO assigns a platform role, not for
     how an identity first exists — FRD 7.4.2 (IdP role mapping) and 8.3
     (custom roles) are both Phase 3 — and the standing instruction is to
     "invent no invitation, activation or account-creation mechanism".

     This obeys that instruction literally, in exactly the way
     `assignTenantAdmin()` already does one plane over: it RECORDS A
     NAMED PERSON in the platform's own directory and invents nothing
     behind them. There is no account, no credential, no password, no
     invitation, no activation and no identity provider — and origin is
     rendered as a provenance line ('seed' vs 'manual'), which is what
     the instruction asks for. What changes is only that the directory
     is no longer closed at five seeded people.

     Registering someone grants NOTHING on its own. Authority still
     comes from `contentRoleAssignments[]`, so a newly registered person
     reaches no content at all until the Super Admin assigns a scope. */

  var CONTENT_ROLE_ORDER = ['vendor', 'reviewer', 'manager'];

  function validateContentActor(fields, existingId) {
    var errs = [];
    var role = String(fields.role || '').trim();
    var name = String(fields.name || '').trim();
    var org = String(fields.organisation || '').trim();
    var email = String(fields.email || '').trim();
    if (CONTENT_ROLE_ORDER.indexOf(role) === -1) {
      errs.push({ field: 'ac-role', message: 'Choose the platform role this person holds.' });
    }
    if (!name) { errs.push({ field: 'ac-name', message: 'Enter the name of the person.' }); }
    /* The Vendor ORGANISATION and the Vendor PERSON are two different
       things in this model and are not collapsed into one field: the
       person acts, the organisation is who they act for. Several people
       may share one organisation — that is a normal Vendor team, not a
       duplicate — so the organisation is never used for uniqueness. */
    if (!org) { errs.push({ field: 'ac-org', message: 'Enter the organisation this person belongs to.' }); }
    if (!email) { errs.push({ field: 'ac-email', message: 'Enter a contact email address.' }); }
    else if (!util.isEmail(email)) {
      errs.push({ field: 'ac-email', message: 'Enter a valid email address.' });
    } else if (S.contentActors.some(function (a) {
      return a.id !== existingId && String(a.email || '').toLowerCase() === email.toLowerCase();
    })) {
      errs.push({ field: 'ac-email', message: 'A platform role holder with this email address already exists.' });
    }
    return errs;
  }

  /* Ids stay in the one `ACT-nnn` namespace the seeded five already use.
     The loop is belt-and-braces against a counter that a much older
     stored state could have left behind its collection. */
  function nextActorId() {
    var taken = {};
    S.contentActors.forEach(function (a) { taken[a.id] = true; });
    var id;
    do { S.seq.actor += 1; id = 'ACT-' + util.pad3(S.seq.actor); } while (taken[id]);
    return id;
  }

  function registerContentActor(fields) {
    var errs = validateContentActor(fields, null);
    if (errs.length) { return { ok: false, errors: errs, actor: null }; }
    var rec = {
      id: nextActorId(),
      /* `key` exists only so the seed can wire its own assignments up.
         A person recorded on the platform has no seed key and needs none. */
      key: null,
      role: String(fields.role).trim(),
      name: String(fields.name).trim(),
      organisation: String(fields.organisation).trim(),
      email: String(fields.email).trim(),
      source: 'manual',
      registeredBy: 'Super Admin',
      registeredAt: new Date().toISOString()
    };
    S.contentActors.push(rec);
    save();
    return { ok: true, errors: [], actor: rec };
  }

  /* ---------- canonical academic structure: create and manage (D3) ----------

     Programme / Department → Course. Platform-controlled (`STK31-10`):
     a Tenant Admin can never reach these functions, and a Vendor,
     Academic Reviewer or Content Manager cannot either — there is no
     actor parameter here because, exactly like `assignPlatformRole()`
     and `assignTenantAdmin()`, this is the Super Admin plane. A Vendor
     SELECTS a canonical Course; it never defines one.

     CREATE and RENAME only. Retire / delete stays absent and stays
     named as absent on screen: every one of these ids is load-bearing
     for live access records, course mappings, faculty mappings and
     assignments, and D3 recommends scoping create first for exactly
     that reason. */

  function groupingRecords() { return S.groupings; }
  function courseRecords() { return S.courses; }
  function groupingRecord(id) {
    return S.groupings.filter(function (g) { return g.id === id; })[0] || null;
  }
  function courseRecord(id) {
    return S.courses.filter(function (c) { return c.id === id; })[0] || null;
  }
  function coursesInGroupingRecord(gid) {
    return S.courses.filter(function (c) { return c.groupingId === gid; });
  }

  /* A readable slug in the SAME namespace the seeded ids use
     ('civil-engineering', 'soil-mechanics'), so nothing about the id
     style changes and a name-based CSV mapping keeps working. */
  function structureSlug(name, takenIds, fallback) {
    /* Trailing hyphens are stripped AFTER the length cap as well as
       before it: truncating at 48 characters can land on a separator,
       and 'marine-engineering-' would be an ugly permanent identifier. */
    var base = String(name || '').toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      .slice(0, 48).replace(/-+$/, '') || fallback;
    var id = base, n = 2;
    while (takenIds.indexOf(id) !== -1) { id = base + '-' + n; n += 1; }
    return id;
  }

  /* Name uniqueness is not cosmetic. `data.groupingByName()` and
     `data.courseByName()` are how a tenant's CSV import maps a LOCAL
     course code onto canonical structure (`STK31-10`), so two Programmes
     sharing a name would make that resolution ambiguous. Courses are
     unique WITHIN a Programme, which is exactly the scope the lookup
     resolves at. */
  function validateGroupingFields(fields, existingId) {
    var errs = [];
    var name = String(fields.name || '').trim();
    var summary = String(fields.summary || '').trim();
    if (!name) { errs.push({ field: 'pg-name', message: 'Enter a Programme / Department name.' }); }
    else if (S.groupings.some(function (g) {
      return g.id !== existingId && data.norm(g.name) === data.norm(name);
    })) {
      errs.push({ field: 'pg-name', message: 'A Programme / Department with this name already exists.' });
    }
    if (!summary) {
      errs.push({ field: 'pg-summary', message: 'Enter a short description — the public catalogue shows it.' });
    }
    return errs;
  }

  function validateCourseFields(fields, existingId) {
    var errs = [];
    var name = String(fields.name || '').trim();
    var summary = String(fields.summary || '').trim();
    var gid = String(fields.groupingId || '').trim();
    if (!groupingRecord(gid)) {
      errs.push({ field: 'pc-grouping', message: 'Choose the Programme / Department this Course sits in.' });
    }
    if (!name) { errs.push({ field: 'pc-name', message: 'Enter a Course name.' }); }
    else if (S.courses.some(function (c) {
      return c.id !== existingId && c.groupingId === gid && data.norm(c.name) === data.norm(name);
    })) {
      errs.push({ field: 'pc-name', message: 'A Course with this name already exists in that Programme / Department.' });
    }
    if (!summary) {
      errs.push({ field: 'pc-summary', message: 'Enter a short description — the public catalogue shows it.' });
    }
    errs = errs.concat(validateCourseCode(fields.code, existingId));
    return errs;
  }

  /* THE CANONICAL COURSE CODE — Implementation 07.2, stakeholder rule E.

     "Content Manager primarily. Super Admin will also get access to it."

     OPTIONAL, AND BLANK IS A PERMANENT LEGITIMATE STATE. No official
     code has been supplied for the sample Courses and none is invented
     here; a Course with no canonical code is a real state the product
     must carry, exactly as a person with no Semester is.

     UNIQUE PLATFORM-WIDE when present — a different scope from the
     Course NAME rule, which is unique only within a Programme, because
     a name is a label inside a tree and a code is platform identity.
     Blanks are skipped, or the five blank seeded rows would collide
     with one another on the first edit.

     ⚠ NOTHING IN THIS BUILD RESOLVES BY CODE. CSV import and manual
     entry resolve canonical structure BY NAME (`data.courseByName`), and
     the tenant's own conflict warning compares LOCAL codes. The
     canonical code is display and governance metadata; changing it here
     is safe, and the surfaces say that outside this prototype an
     external student-information system would key on it. */
  function validateCourseCode(value, existingId) {
    var code = String(value == null ? '' : value).trim();
    if (!code) { return []; }
    if (code.length > 40) {
      return [{ field: 'pc-code', message: 'A Course code is at most 40 characters.' }];
    }
    var clash = S.courses.filter(function (c) {
      return c.id !== existingId && data.norm(c.code || '') === data.norm(code);
    })[0];
    if (clash) {
      return [{ field: 'pc-code',
        message: 'Another Course already uses the code ' + clash.code + ' (' + clash.name + '). ' +
                 'A canonical Course code identifies one Course across the whole platform.' }];
    }
    return [];
  }

  /* ONE id namespace for the whole structure.

     Minting only against the target collection let a Programme named
     "Soil Mechanics" take the id an existing Course already held, so
     `data.grouping('soil-mechanics')` and `data.course('soil-mechanics')`
     both resolved — to two different records. Nothing conflated them
     today, because the routes are separate, but two records sharing one
     readable id in a structure whose whole job is unambiguous reference
     is a trap, not a feature. Experiment ids are included too, for the
     same reason. */
  function structureNamespace() {
    var taken = S.groupings.map(function (g) { return g.id; })
      .concat(S.courses.map(function (c) { return c.id; }));
    S.contentRecords.forEach(function (r) { taken.push(r.id); });
    return taken;
  }

  function createGrouping(fields) {
    var errs = validateGroupingFields(fields, null);
    if (errs.length) { return { ok: false, errors: errs, grouping: null }; }
    var rec = {
      id: structureSlug(fields.name, structureNamespace(), 'programme'),
      name: String(fields.name).trim(),
      summary: String(fields.summary).trim(),
      source: 'manual',
      createdBy: 'Super Admin',
      createdAt: new Date().toISOString(),
      updatedAt: null
    };
    S.groupings.push(rec);
    save();
    return { ok: true, errors: [], grouping: rec };
  }

  /* Rename / re-describe. The ID NEVER CHANGES, which is what keeps
     every stored reference to this Programme valid across a rename. */
  function updateGrouping(id, fields) {
    var rec = groupingRecord(id);
    if (!rec) {
      return { ok: false, errors: [{ field: 'pg-name', message: 'This Programme / Department no longer exists.' }], grouping: null };
    }
    var errs = validateGroupingFields(fields, id);
    if (errs.length) { return { ok: false, errors: errs, grouping: null }; }
    rec.name = String(fields.name).trim();
    rec.summary = String(fields.summary).trim();
    rec.updatedAt = new Date().toISOString();
    save();
    return { ok: true, errors: [], grouping: rec };
  }

  function createCourse(fields) {
    var errs = validateCourseFields(fields, null);
    if (errs.length) { return { ok: false, errors: errs, course: null }; }
    var rec = {
      id: structureSlug(fields.name, structureNamespace(), 'course'),
      groupingId: String(fields.groupingId).trim(),
      name: String(fields.name).trim(),
      /* The canonical Course code. Optional here — the Content Manager
         owns it primarily and may set it later from their own
         workspace; the Super Admin can also set it, here and on the
         edit form (Implementation 07.2, rule E). */
      code: String(fields.code || '').trim(),
      summary: String(fields.summary).trim(),
      source: 'manual',
      createdBy: 'Super Admin',
      createdAt: new Date().toISOString(),
      updatedAt: null
    };
    /* A code supplied at creation was still set BY somebody, and the
       provenance column would otherwise read "Never set" beside a code
       that is plainly there. */
    if (rec.code) { rec.codeSetBy = 'Super Admin'; rec.codeSetAt = rec.createdAt; }
    S.courses.push(rec);
    save();
    return { ok: true, errors: [], course: rec };
  }

  /* Rename, re-describe, and re-parent into a different Programme.
     Re-parenting is safe and deliberate: nothing stores a
     grouping→course edge except the Course row itself, so the Experiments
     filed under this Course, the tenant mappings that name it and the
     role assignments that cover it are all untouched — only where it
     appears in the tree changes. The id never changes. */
  function updateCourse(id, fields) {
    var rec = courseRecord(id);
    if (!rec) {
      return { ok: false, errors: [{ field: 'pc-name', message: 'This Course no longer exists.' }], course: null };
    }
    var errs = validateCourseFields(fields, id);
    var moving = String(fields.groupingId).trim() !== rec.groupingId;
    if (moving) {
      var enrolled = courseMoveBlock(id);
      if (enrolled) {
        errs.push({ field: 'pc-grouping', message: 'This Course cannot change Programme / Department: ' +
          enrolled + ' ' + util.plural(enrolled, 'person is', 'people are') + ' filed against it, and each of ' +
          'those records stores its own Programme. Renaming and re-describing are still available.' });
      }
    }
    if (errs.length) { return { ok: false, errors: errs, course: null }; }
    rec.name = String(fields.name).trim();
    rec.summary = String(fields.summary).trim();
    rec.groupingId = String(fields.groupingId).trim();
    /* THE SUPER ADMIN'S HALF OF RULE E. The canonical code is primarily
       the Content Manager's, and the Super Admin also has access to it —
       through this form, which is the structure editor they already own.
       `fields.code` absent leaves the stored code exactly as it is, so a
       caller that does not know about the field cannot blank one. */
    if (fields.code !== undefined) {
      var nextCode = String(fields.code || '').trim();
      if (nextCode !== (rec.code || '')) {
        rec.code = nextCode;
        rec.codeSetBy = 'Super Admin';
        rec.codeSetAt = new Date().toISOString();
      }
    }
    rec.updatedAt = new Date().toISOString();
    save();
    return { ok: true, errors: [], course: rec };
  }

  /* ============================================================
     THE CONTENT MANAGER'S HALF OF RULE E.

     "Content Manager primarily. Super Admin will also get access to it."

     This is the ONLY actor-scoped structure writer in the build, and it
     writes exactly one field. It deliberately does NOT let a Content
     Manager create, rename, re-parent or delete a Course: the structure
     itself stays platform-controlled (STK31-10), and only the canonical
     CODE moves into Content Manager governance.

     AUTHORISATION LIVES HERE, NOT IN THE ROUTE. The prototype has no
     authentication and its routes carry only a shell label, so the
     boundary that matters is this one — the same discipline
     `updateCanonicalMetadata` already follows: the actor must be a
     Content Manager, and the Course must be inside their assigned
     scope. A platform-scope manager covers every Course; a
     Course-scoped manager covers only theirs; an Experiment-scoped
     manager reaches the Course their Experiment sits in.

     ⚠ A TENANT ADMIN CANNOT REACH THIS. Tenant Admins are not content
     actors at all — they live in `tenantAdmins[]`, have no
     `contentRoleAssignments[]` row, and `contentActor()` cannot resolve
     one. Their own course code stays exactly where it has always been,
     on `courseMappings[].localCode`, scoped to their institution.
     ============================================================ */
  /* ⚠ THE SCOPE HERE IS THE AUTHORING SCOPE, NOT THE READING ONE.

     `actorCourseIds` widens an EXPERIMENT-scope assignment to that
     Experiment's Course, which is right for READING — you must be able
     to see the Course your Experiment sits in. It is wrong for WRITING
     PLATFORM MASTER DATA: an assignment naming one Experiment does not
     carry authority over the Course that Experiment happens to be filed
     in, and the canonical code belongs to the whole Course and every
     other Experiment in it.

     This is the same distinction `actorCreateCourseIds` already draws,
     and the same test `managerCanFileInto` already applies to a
     destination Course: platform scope, or an explicit Course scope. */
  function managerCourseCodeIds(actorId) {
    var rows = assignmentsFor(actorId);
    if (rows.some(function (m) { return m.scope === 'all'; })) {
      return data.courses().map(function (c) { return c.id; });
    }
    var out = [];
    rows.forEach(function (m) {
      if (m.scope === 'course' && m.courseId && out.indexOf(m.courseId) === -1) { out.push(m.courseId); }
    });
    return out;
  }
  function managerCanSetCourseCode(actorId, courseId) {
    var actor = contentActor(actorId);
    if (!actor || actor.role !== CONTENT_ROLE.MANAGER) { return false; }
    if (!courseRecord(courseId)) { return false; }
    return managerCourseCodeIds(actorId).indexOf(courseId) !== -1;
  }
  function coursesForManager(actorId) {
    var ids = managerCourseCodeIds(actorId);
    return S.courses.filter(function (c) { return ids.indexOf(c.id) !== -1; });
  }
  function updateCourseCode(actorId, courseId, code) {
    var actor = contentActor(actorId);
    if (!actor || actor.role !== CONTENT_ROLE.MANAGER) {
      return { ok: false, errors: [{ field: 'pc-code',
        message: 'The canonical Course code is managed by the Content Manager and the Super Admin.' }], course: null };
    }
    var rec = courseRecord(courseId);
    if (!rec) {
      return { ok: false, errors: [{ field: 'pc-code', message: 'This Course no longer exists.' }], course: null };
    }
    if (!managerCanSetCourseCode(actorId, courseId)) {
      return { ok: false, errors: [{ field: 'pc-code',
        message: 'This Course is outside your assigned scope. Scope is governed by the Super Admin.' }], course: null };
    }
    var errs = validateCourseCode(code, courseId);
    if (errs.length) { return { ok: false, errors: errs, course: null }; }
    rec.code = String(code || '').trim();
    rec.updatedAt = new Date().toISOString();
    rec.codeSetBy = actor.name;
    rec.codeSetAt = rec.updatedAt;
    save();
    return { ok: true, errors: [], course: rec };
  }

  /* How much of the platform a structure row is already carrying — the
     honest answer to "can I still change this?", and what the screen
     shows instead of a delete control. */
  function courseUsage(courseId) {
    return {
      records: S.contentRecords.filter(function (r) { return r.courseId === courseId; }).length,
      mappings: S.courseMappings.filter(function (m) { return m.courseId === courseId; }).length,
      assignments: roleAssignments({}).filter(function (m) { return m.courseId === courseId; }).length,
      /* Faculty mappings and enrolled people are references too. Counting
         only the first three let a Course that Faculty teach and students
         are enrolled against report "Not yet referenced", which is the
         opposite of what the screen is for. */
      facultyMappings: S.facultyMappings.filter(function (f) {
        return f.courseId === courseId && f.status === 'active';
      }).length,
      people: S.people.filter(function (pp) { return pp.courseId === courseId; }).length
    };
  }
  /* A Course may only change Programme while NO PERSON is filed against
     it.

     This is a real consequence, not a formality. A student record carries
     its OWN `groupingId` alongside its `courseId`, and the CSV import
     validates at entry that the Course sits inside that Programme
     (`data.courseByName(name, groupingId)`). Moving the Course afterwards
     would leave those two fields disagreeing — silently, from a different
     plane, in tenant-owned records the Super Admin does not own and must
     not rewrite. So the move is refused while anyone is enrolled, which
     still leaves the case the capability is actually for: a Course filed
     under the wrong Programme, corrected before anybody is enrolled. */
  function courseMoveBlock(courseId) {
    var enrolled = S.people.filter(function (pp) { return pp.courseId === courseId; }).length;
    return enrolled ? enrolled : 0;
  }

  /* ---------- platform role governance (STK31-41) ---------- */

  var ROLE_SCOPE = { ALL: 'all', COURSE: 'course', EXPERIMENT: 'experiment' };
  var ROLE_SCOPE_LABEL = { all: 'Platform-wide', course: 'Course', experiment: 'Experiment' };

  /* Which scope levels each role may legitimately hold.

     ⚠ IMPLEMENTATION JUDGEMENT, documented and reversible. STK31-41
     confirms Course- and Experiment-specific assignment for all three
     roles and forbids assuming assignment is global-only. It does not
     enumerate which roles may ALSO hold a platform-wide scope. The
     Content Library is a platform-level surface (STK31-06), so the
     Content Manager keeps platform scope; Vendor and Academic Reviewer
     are restricted to the two granularities the source names, because
     granting a platform-wide reviewer or vendor scope would widen
     authority no source describes. */
  var ROLE_SCOPES_ALLOWED = {
    vendor:   [ROLE_SCOPE.COURSE, ROLE_SCOPE.EXPERIMENT],
    reviewer: [ROLE_SCOPE.COURSE, ROLE_SCOPE.EXPERIMENT],
    manager:  [ROLE_SCOPE.ALL, ROLE_SCOPE.COURSE, ROLE_SCOPE.EXPERIMENT]
  };
  function roleScopesAllowed(role) { return (ROLE_SCOPES_ALLOWED[role] || []).slice(); }
  function roleScopeLabel(scope) { return ROLE_SCOPE_LABEL[scope] || scope; }

  function roleAssignments(opts) {
    opts = opts || {};
    return S.contentRoleAssignments.filter(function (m) {
      if (!opts.includeRemoved && m.status === 'removed') { return false; }
      if (opts.role && m.role !== opts.role) { return false; }
      if (opts.actorId && m.actorId !== opts.actorId) { return false; }
      return true;
    });
  }
  function roleAssignmentById(id) {
    return S.contentRoleAssignments.filter(function (m) { return m.id === id; })[0] || null;
  }
  /* Everyone currently holding authority over one canonical Course, by
     role — the "who is responsible for this?" question the governance
     and canonical surfaces both ask. Several people on one Course or one
     Experiment is explicitly permitted (STK31-41). */
  function actorsForCourse(courseId, role) {
    var out = [];
    roleAssignments({ role: role }).forEach(function (m) {
      var covers = m.scope === ROLE_SCOPE.ALL ||
        (m.scope === ROLE_SCOPE.COURSE && m.courseId === courseId) ||
        (m.scope === ROLE_SCOPE.EXPERIMENT && (function () {
          var rec = contentRecord(m.experimentId);
          return !!rec && rec.courseId === courseId;
        })());
      if (!covers) { return; }
      var a = contentActor(m.actorId);
      if (a && out.indexOf(a) === -1) { out.push(a); }
    });
    return out;
  }
  function actorsForRecord(rec, role) {
    if (!rec) { return []; }
    return contentActors(role).filter(function (a) { return actorCoversRecord(a.id, rec); });
  }

  function validateRoleAssignment(fields) {
    var errs = [];
    var actor = contentActor(fields.actorId);
    if (!actor) { errs.push({ field: 'ra-actor', message: 'Choose the person to assign.' }); }
    var role = actor ? actor.role : fields.role;
    var scope = fields.scope;
    if (roleScopesAllowed(role).indexOf(scope) === -1) {
      errs.push({ field: 'ra-scope', message: 'This scope level is not available for the ' +
        (contentRoleLabel(role) || 'selected') + ' role.' });
    }
    if (scope === ROLE_SCOPE.COURSE && !data.course(fields.courseId)) {
      errs.push({ field: 'ra-course', message: 'Choose the Course this assignment covers.' });
    }
    if (scope === ROLE_SCOPE.EXPERIMENT) {
      var rec = contentRecord(fields.experimentId);
      if (!rec) { errs.push({ field: 'ra-experiment', message: 'Choose the Experiment this assignment covers.' }); }
    }
    if (!errs.length && actor) {
      var dup = roleAssignments({ actorId: actor.id }).some(function (m) {
        return m.scope === scope &&
          (scope !== ROLE_SCOPE.COURSE || m.courseId === fields.courseId) &&
          (scope !== ROLE_SCOPE.EXPERIMENT || m.experimentId === fields.experimentId);
      });
      if (dup) { errs.push({ field: 'ra-scope', message: 'This person already holds that scope.' }); }
    }
    return errs;
  }

  function assignPlatformRole(fields) {
    var errs = validateRoleAssignment(fields);
    if (errs.length) { return { ok: false, errors: errs, assignment: null }; }
    var actor = contentActor(fields.actorId);
    S.seq.roleAssign += 1;
    var rec = {
      id: 'CRA-' + util.pad3(S.seq.roleAssign),
      actorId: actor.id,
      role: actor.role,
      scope: fields.scope,
      courseId: fields.scope === ROLE_SCOPE.COURSE ? fields.courseId : null,
      experimentId: fields.scope === ROLE_SCOPE.EXPERIMENT ? fields.experimentId : null,
      source: 'manual',
      status: 'active',
      assignedBy: 'Super Admin',
      assignedAt: new Date().toISOString(),
      removedBy: null, removedAt: null, removedReason: '',
      /* 07.3 — the DURABLE audit line. The three `removed*` fields above
         describe the CURRENT state only and are cleared on restore; this
         array is append-only and is never cleared, so "was this actor
         ever suspended, by whom, and why?" survives the restore. */
      history: []
    };
    S.contentRoleAssignments.push(rec);
    contentTouched();
    save();
    return { ok: true, errors: [], assignment: rec };
  }

  /* Withdrawing a scope removes FUTURE authority and nothing else.

     The row is marked removed, never deleted, and no decision, review,
     publication, outcome or history entry is touched — a completed
     academic decision stays in the record's history and in
     `academicReviews[]` with the reviewer's name on it, exactly as it
     was made. Re-assigning the same scope restores the actionable work.
     This is STK31-22's reversibility rule applied to authority. */
  function removePlatformRoleAssignment(id, reason) {
    var rec = roleAssignmentById(id);
    if (!rec || rec.status === 'removed') { return null; }
    /* REASON REQUIRED — Implementation 07.2, stakeholder rule F.
       Withdrawing a scope freezes somebody's workspace: their records
       become read-only and, if nobody else covers them, unreachable.
       That is consequential, and a consequential override must say why.
       Everything that already calls this passes one. */
    var note = String(reason || '').trim();
    if (!note) { return null; }
    rec.status = 'removed';
    rec.removedBy = 'Super Admin';
    rec.removedAt = new Date().toISOString();
    rec.removedReason = note;
    pushRoleAssignmentEvent(rec, 'withdrawn', 'Scope withdrawn', note, rec.removedAt);
    contentTouched();
    save();
    return rec;
  }
  /* WITHDRAW EVERY SCOPE THIS ACTOR HOLDS, as ONE decision with ONE
     reason — the whole of "suspend this Vendor / Reviewer / Content
     Manager" with no new field and no new state. It is a loop over the
     writer above, so each row keeps its own audit line and each one is
     individually restorable; nothing is deleted and no record they have
     already acted on loses their name. */
  function withdrawAllScopesForActor(actorId, reason) {
    var note = String(reason || '').trim();
    if (!note) { return null; }
    var actor = contentActor(actorId);
    if (!actor) { return null; }
    var live = roleAssignments({ actorId: actorId });
    if (!live.length) { return null; }
    var removed = [];
    live.slice().forEach(function (m) {
      if (removePlatformRoleAssignment(m.id, note)) { removed.push(m); }
    });
    return removed.length ? removed : null;
  }
  /* Re-instating a withdrawn row rather than creating a duplicate. */
  /* ⚠ RESTORING MUST NOT ERASE THE SUSPENSION — 07.3 adversarial fix.

     This cleared `removedBy` / `removedAt` / `removedReason` and the row
     carried no history, so restoring a scope destroyed every trace that
     a Vendor, Academic Reviewer or Content Manager had ever been
     suspended and why. Clarification F grants the Super Admin genuine
     operational authority *with auditability*; an override whose
     evidence disappears one click later is not auditable.

     The three `removed*` fields still describe the CURRENT state — every
     screen reads them that way — but what they held is appended to the
     append-only `history` first. `reason` is optional here: restoring
     returns authority rather than taking it away, so it is the lower-
     consequence half of the pair, and refusing a restore for want of a
     sentence would leave a workspace frozen. */
  function restorePlatformRoleAssignment(id, reason) {
    var rec = roleAssignmentById(id);
    if (!rec || rec.status !== 'removed') { return null; }
    var dup = roleAssignments({ actorId: rec.actorId }).some(function (m) {
      return m.scope === rec.scope && m.courseId === rec.courseId && m.experimentId === rec.experimentId;
    });
    if (dup) { return null; }
    var now = new Date().toISOString();
    pushRoleAssignmentEvent(rec, 'restored', 'Scope restored',
      String(reason || '').trim(), now, {
        /* What is about to be cleared, kept verbatim. */
        clearedRemovedBy: rec.removedBy, clearedRemovedAt: rec.removedAt,
        clearedRemovedReason: rec.removedReason
      });
    rec.status = 'active';
    rec.removedBy = null; rec.removedAt = null; rec.removedReason = '';
    rec.assignedBy = 'Super Admin';
    rec.assignedAt = now;
    contentTouched();
    save();
    return rec;
  }

  /* Append-only. Never cleared, never reordered, never rewritten. */
  function pushRoleAssignmentEvent(rec, kind, label, note, at, extra) {
    if (!Array.isArray(rec.history)) { rec.history = []; }
    var e = { kind: kind, label: label, note: note || '',
              by: 'Super Admin', at: at || new Date().toISOString() };
    if (extra) { Object.keys(extra).forEach(function (k) { e[k] = extra[k]; }); }
    rec.history.push(e);
    return e;
  }

  /* Every withdrawal/restore this scope has ever seen, oldest first. */
  function roleAssignmentHistory(id) {
    var rec = roleAssignmentById(id);
    return rec && Array.isArray(rec.history) ? rec.history.slice() : [];
  }
  /* Has this actor EVER had a scope withdrawn? Reads the durable line,
     so it stays true after every one of them was restored. */
  function actorWasEverSuspended(actorId) {
    return roleAssignments({ actorId: actorId, includeRemoved: true })
      .some(function (m) {
        /* A row that is withdrawn RIGHT NOW counts, whatever its history
           holds — the state itself is the evidence. */
        if (m.status === 'removed') { return true; }
        return Array.isArray(m.history) &&
          m.history.some(function (h) {
            return h.kind === 'withdrawn' || h.clearedRemovedAt || h.clearedRemovedReason;
          });
      });
  }
  /* Records an actor has already ACTED on, whatever their scope is now.
     Used so a workspace can keep showing a person their own completed
     history after the scope behind it was withdrawn. */
  function actorHistoricalRecordIds(actorId) {
    var actor = contentActor(actorId);
    if (!actor) { return []; }
    var ids = {};
    /* The AUTHORITATIVE records first — an academic decision, a
       publication and a submission each carry the actor's id in their
       own row, so this answer does not depend on the history entries at
       all. The history is then read as well, which picks up actions
       (metadata corrections, change requests) that have no record of
       their own. */
    academicReviewsBy(actorId).forEach(function (r) { ids[r.recordId] = true; });
    S.contentVersions.forEach(function (v) {
      if (v.academicDecisionBy === actorId || v.createdBy === actorId) { ids[v.recordId] = true; }
    });
    S.publicationRecords.forEach(function (p) {
      if (p.publishedBy === actorId) { ids[p.recordId] = true; }
    });
    S.contentRecords.forEach(function (rec) {
      if (rec.createdBy === actorId) { ids[rec.id] = true; }
      (rec.history || []).forEach(function (h) { if (h.actorId === actorId) { ids[rec.id] = true; } });
    });
    return Object.keys(ids);
  }

  /* ---------- canonical / master metadata, Super Admin side (STK31-09) ----------
     The SAME canonical fields the Content Manager may correct, from the
     platform master surface. Learning Outcomes stay academically owned
     (STK31-08) and technology delivery stays the Vendor's technical
     submission — neither is editable here, from either surface.

     ⚠ NOT IMPLEMENTED, and shown as a gap rather than invented: creating
     or deleting a Programme / Academic Grouping or a Course. STK31-09
     confirms canonical metadata MANAGEMENT and STK31-10 confirms the
     structure is platform-controlled; neither describes a create or
     delete operation, and the ids in question are load-bearing for every
     existing access record, mapping and assignment. */
  function updateCanonicalAsPlatform(recordId, fields, reason) {
    var rec = contentRecord(recordId);
    if (!rec) { return { ok: false, errors: [{ field: 'cm-name', message: 'This content record no longer exists.' }], record: null }; }
    if (!canonicalEditable(rec)) {
      return { ok: false, errors: [{ field: 'cm-name',
        message: 'Canonical metadata can be corrected for published content and for content at the readiness gate. ' +
          'A record still with the Vendor or the Academic Reviewer is not edited from here.' }], record: null };
    }
    var errs = [];
    var name = String(fields.name || '').trim();
    if (!name) { errs.push({ field: 'cm-name', message: 'Enter the canonical Experiment name.' }); }
    else if (nameTaken(name, rec.id)) { errs.push({ field: 'cm-name', message: 'Another experiment already uses this name.' }); }
    if (!data.course(fields.courseId)) { errs.push({ field: 'cm-course', message: 'Choose the Course this Experiment belongs to.' }); }
    /* REASON REQUIRED ON PUBLISHED CONTENT — Implementation 07.2, rule F.
       Editing the master record of something the public catalogue is
       already showing is the most consequential content act the Super
       Admin has. At the readiness gate the record is not public yet and
       the reason stays optional. */
    if (rec.status === CONTENT_STATUS.PUBLISHED && !String(reason || '').trim()) {
      errs.push({ field: 'cm-reason',
        message: 'Say why the published master record is being corrected. The catalogue shows this change immediately.' });
    }
    if (errs.length) { return { ok: false, errors: errs, record: null }; }
    var now = new Date().toISOString();
    rec.name = name;
    rec.courseId = fields.courseId;
    rec.summary = String(fields.summary || '').trim();
    rec.description = String(fields.description || '').trim();
    rec.updatedAt = now;
    /* WHY, NOT ONLY WHO — Implementation 07.2, stakeholder rule F.
       This rewrites a PUBLISHED Experiment's public name, Course,
       summary and description, and the public catalogue shows the change
       immediately. A reason is REQUIRED when the record is published;
       at the readiness gate, where the Content Manager is about to
       publish it anyway, it stays optional. */
    pushContentEvent(rec, 'metadata', 'Canonical metadata updated (platform master)',
      PLATFORM_ACTOR, now, String(reason || '').trim());
    save();
    return { ok: true, errors: [], record: rec };
  }

  /* ============================================================
     PLATFORM OVERRIDE ON THE CONTENT CHAIN
     — Implementation 07.2, stakeholder rule F.

     The stakeholder confirmed that the Super Admin has overall control
     "as of now", including content changes and Vendor / Academic
     Reviewer / Content Manager issues.

     ── WHAT THAT DOES NOT MEAN ──────────────────────────────────
     It does not mean an invisible mutation mechanism, and it does not
     mean normal ownership disappears. The Vendor still submits, the
     Academic Reviewer still validates and owns the Learning Outcomes,
     and the Content Manager still controls first publication — none of
     `vendorCanEdit`, `reviewerCanAct` or `managerCanAct` is widened by
     a single character. This is a SEPARATE, SEPARATELY LABELLED
     surface, and every use of it is explicit, reasoned and audited.

     ── THE PUBLISH FIREWALL IS NOT CROSSED ──────────────────────
     PUBLISHED is refused as a destination AND as an origin. First
     publication is the Content Manager's act (STK31-06) and there is no
     publish control anywhere on the Super Admin plane; a later version
     of already-published content is the Super Admin's, through Release
     / Hold, which acts on a DIFFERENT object. An override that could
     publish — or un-publish — would contradict both, and would strand
     live access records, faculty mappings, assignments and in-progress
     attempts that already reference the Experiment id.

     ── WHAT IT IS FOR ───────────────────────────────────────────
     Unsticking the chain. A submission whose only assigned Academic
     Reviewer has had their scope withdrawn sits in ACADEMIC_REVIEW with
     nobody able to move it, and today nothing in the build can free it.
     ============================================================ */
  var OVERRIDABLE_STATUS = [
    CONTENT_STATUS.DRAFT,
    CONTENT_STATUS.ACADEMIC_REVIEW,
    CONTENT_STATUS.CHANGES_ACADEMIC,
    CONTENT_STATUS.CONTENT_REVIEW,
    CONTENT_STATUS.CHANGES_CONTENT,
    CONTENT_STATUS.CHANGES_ACADEMIC_RECHECK
  ];
  /* Where this record may be moved to, and — for each destination —
     whether anybody live can actually act once it is there. The screen
     shows this BEFORE the decision, so an override cannot quietly
     create a record nobody can reach. */
  function overrideDestinations(recordId) {
    var rec = contentRecord(recordId);
    if (!rec || rec.status === CONTENT_STATUS.PUBLISHED) { return []; }
    return OVERRIDABLE_STATUS.filter(function (st) { return st !== rec.status; })
      .map(function (st) {
        var meta = CONTENT_STATUS_META[st];
        var covering = actorsForRecord(rec).filter(function (a) {
          return a.role === meta.holder;
        });
        return {
          status: st,
          label: meta.label,
          holder: meta.holder,
          holderLabel: meta.holder ? contentRoleLabel(meta.holder) : null,
          actors: covering,
          reachable: covering.length > 0
        };
      });
  }
  function overrideContentStatusAsPlatform(recordId, toStatus, reason) {
    var rec = contentRecord(recordId);
    if (!rec) { return null; }
    /* REASON REQUIRED. An override with no stated reason is exactly the
       invisible mutation this must not become. */
    var note = String(reason || '').trim();
    if (!note) { return null; }
    if (OVERRIDABLE_STATUS.indexOf(toStatus) === -1) { return null; }
    /* THE FIREWALL, in both directions. */
    if (rec.status === CONTENT_STATUS.PUBLISHED) { return null; }
    if (rec.status === toStatus) { return null; }
    var from = rec.status;
    var now = new Date().toISOString();
    rec.status = toStatus;
    /* `returnedGate` IS THE DESTINATION, NOT A LEFTOVER.

       It records which gate a record was returned at, and `submitContent`
       reads it to decide where a resubmission goes back to: 'content'
       sends it straight to the readiness gate, anything else sends it to
       academic review. Nulling it made the two "Changes requested"
       destinations behave identically — a Super Admin who deliberately
       chose CHANGES_CONTENT would have watched the resubmission go to
       the Academic Reviewer anyway, silently undoing the choice.

       So it is SET to match the destination, and cleared only for a
       destination that is not a return at all. */
    rec.returnedGate = toStatus === CONTENT_STATUS.CHANGES_CONTENT ? 'content'
                     : toStatus === CONTENT_STATUS.CHANGES_ACADEMIC ? 'academic'
                     : null;
    rec.updatedAt = now;
    if (!Array.isArray(rec.overrides)) { rec.overrides = []; }
    rec.overrides.push({
      at: now, from: from, to: toStatus,
      by: 'Super Admin — platform override',
      reason: note
    });
    /* ONE event, through the ordinary writer, so the override appears in
       the SAME timeline the Vendor, the Academic Reviewer and the
       Content Manager already read — and so `contentTouched()` runs and
       no surface reads a stale pool. Nothing already in `history[]`,
       `academicReview`, `publication`, `academicReviews[]` or
       `publicationRecords[]` is touched. */
    pushContentEvent(rec, 'override',
      'Moved by platform override — ' + CONTENT_STATUS_META[from].label +
      ' → ' + CONTENT_STATUS_META[toStatus].label,
      PLATFORM_ACTOR, now, note);
    save();
    return rec;
  }

  /* The canonical structure, read-only: Programme / Department → Course →
     Experiment, with the live publication state and technology
     availability of each Experiment and who holds authority over it. */
  function canonicalTree() {
    return data.groupings().map(function (g) {
      return {
        grouping: g,
        courses: data.courses().filter(function (c) { return c.groupingId === g.id; }).map(function (c) {
          return {
            course: c,
            records: S.contentRecords.filter(function (r) { return r.courseId === c.id; })
              .sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; })
          };
        })
      };
    });
  }

  /* ============================================================
     LATER VERSION — RELEASE / HOLD  (STK31-07 · FRD 2.3.2)

     ── THE FIREWALL, IN CODE ────────────────────────────────────
     FIRST PUBLICATION of a NEW Experiment  → Content Manager → PUBLISH.
       That is `publishContent()` above, and it acts on a
       `contentRecords[]` row that has never been published.
     LATER VERSION of an ALREADY-PUBLISHED Experiment → Super Admin →
       RELEASE / HOLD. That is `releaseVersion()` / `holdVersion()`
       below, and it acts on a `contentVersions[]` row — A DIFFERENT
       OBJECT. Neither function can reach the other's object, and
       neither word appears on the other's surface.

     ── THE TWO VERSION SCHEMES, RECONCILED BY STATEMENT ─────────
     `10_SUPER_ADMIN_PLATFORM_MODEL.md` §4 records that Batch 01's
     integer `version` (correction rounds on a submission) and Batch 05's
     version on a published module are unconnected, and asks for "either
     one scheme or an explicit statement that these are two different
     objects". This build makes the explicit statement:
       · `contentRecord.revision`      counts CORRECTION ROUNDS. Unchanged.
       · `contentVersion.versionLabel` is the PUBLISHED VERSION of the
                                       Experiment, and only a RELEASE
                                       changes the one the public sees.

     ── THE PATH, AND THE JUDGEMENT CALL IN IT ───────────────────
     The confirmed path is "current released version → newer APPROVED
     version → SUPER ADMIN Release / Hold". STK31-08 gives the Vendor
     "version submissions" and the Academic Reviewer "the academic review
     decision", which supplies the approval. It scopes the Content
     Manager to "first approval/publication" — first instance — and
     STK31-06 says the same, so the Content Manager is NOT modelled as a
     gate on a later version. "No additional approval gates may be
     invented" (STK31-08) is the reason to leave them out rather than in.
     The Content Manager still SEES every version in the Content Library,
     read-only. ⚠ This is an implementation judgement, not a
     stakeholder-confirmed sequence, and is recorded as one.

     ── WHAT A LATER VERSION MAY CARRY, AND WHY NOT MORE ─────────
     Description, version label, vendor notes, and per-technology
     delivery references. It may NOT change technology availability:
     no source states what happens to a tenant that already holds a
     technology a newer version drops, and the prototype will not offer
     an action whose consequence it cannot state honestly. Recorded as
     an open policy gap.
     ============================================================ */

  /* The Super Admin as an actor for the shared history renderers. Its
     `role` is the LABEL, not an internal token: the timeline prints
     `actorName · actorRole`, so a raw `'platform'` would reach the screen
     and "Super Admin · Super Admin" would read as a bug. A null role
     makes the renderer print the name alone. */
  var PLATFORM_ACTOR = { id: null, name: 'Super Admin', role: null };

  var VERSION_STATUS = {
    DRAFT:            'DRAFT',
    ACADEMIC_REVIEW:  'ACADEMIC_REVIEW',
    CHANGES_ACADEMIC: 'CHANGES_ACADEMIC',
    APPROVED:         'APPROVED',
    RELEASED:         'RELEASED',
    HELD:             'HELD'
  };
  var VERSION_STATUS_META = {
    DRAFT:            { label: 'Draft version',        badge: 'b-neutral', icon: 'edit',   holder: 'vendor' },
    ACADEMIC_REVIEW:  { label: 'Academic review',      badge: 'b-info',    icon: 'clock',  holder: 'reviewer' },
    CHANGES_ACADEMIC: { label: 'Changes requested',    badge: 'b-warning', icon: 'alert',  holder: 'vendor' },
    APPROVED:         { label: 'Awaiting Release / Hold', badge: 'b-info', icon: 'shield', holder: 'platform' },
    RELEASED:         { label: 'Released',             badge: 'b-success', icon: 'check',  holder: null },
    HELD:             { label: 'On hold',              badge: 'b-warning', icon: 'minus',  holder: 'platform' }
  };
  function versionStatusMeta(status) {
    return VERSION_STATUS_META[status] || { label: status, badge: 'b-neutral', icon: 'circle', holder: null };
  }
  /* A version the workflow is still carrying — not yet released, not
     abandoned. Exactly one may exist per Experiment at a time, which is
     what prevents two candidates racing for one public version. */
  var VERSION_OPEN = [VERSION_STATUS.DRAFT, VERSION_STATUS.ACADEMIC_REVIEW,
                      VERSION_STATUS.CHANGES_ACADEMIC, VERSION_STATUS.APPROVED, VERSION_STATUS.HELD];

  function contentVersions() { return S.contentVersions; }
  function contentVersion(id) {
    return S.contentVersions.filter(function (v) { return v.id === id; })[0] || null;
  }
  function versionsForRecord(recordId) {
    return S.contentVersions.filter(function (v) { return v.recordId === recordId; })
      .sort(function (a, b) { return (b.seq || 0) - (a.seq || 0); });
  }
  function openVersionForRecord(recordId) {
    return S.contentVersions.filter(function (v) {
      return v.recordId === recordId && VERSION_OPEN.indexOf(v.status) !== -1;
    })[0] || null;
  }
  function releasedVersionsForRecord(recordId) {
    return versionsForRecord(recordId).filter(function (v) { return v.status === VERSION_STATUS.RELEASED; });
  }
  /* The version label the public currently sees. It comes from the
     record itself, which only a RELEASE (or the first publication) ever
     writes — never from a candidate. */
  function currentVersionLabel(rec) {
    return rec ? (rec.versionLabel || '') : '';
  }
  function versionsAwaitingDecision() {
    return S.contentVersions.filter(function (v) { return v.status === VERSION_STATUS.APPROVED; })
      .sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
  }
  function versionsOnHold() {
    return S.contentVersions.filter(function (v) { return v.status === VERSION_STATUS.HELD; });
  }
  /* A DRAFT candidate is still with its Vendor. The version form promises
     "it reaches the Academic Reviewer only when you submit it", so a draft
     is excluded here — showing it would break that promise and put a
     reviewer's eyes on work nobody has handed over. */
  function versionsForReviewer(actorId, opts) {
    opts = opts || {};
    return S.contentVersions.filter(function (v) {
      if (v.status === VERSION_STATUS.DRAFT) { return false; }
      if (opts.status && v.status !== opts.status) { return false; }
      var rec = contentRecord(v.recordId);
      return !!rec && actorCoversRecord(actorId, rec);
    }).sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
  }
  function versionsForVendor(actorId) {
    return S.contentVersions.filter(function (v) { return v.createdBy === actorId; })
      .sort(function (a, b) { return (b.seq || 0) - (a.seq || 0); });
  }

  function pushVersionEvent(v, kind, label, actor, note) {
    if (!Array.isArray(v.history)) { v.history = []; }
    S.seq.event += 1;
    v.history.push({
      seq: S.seq.event, kind: kind, label: label,
      actorId: actor && actor.id ? actor.id : null,
      actorName: actor ? actor.name : PLATFORM_ACTOR.name,
      actorRole: actor && actor.role ? contentRoleLabel(actor.role) : null,
      at: new Date().toISOString(),
      note: String(note || '').trim()
    });
  }

  function validateVersion(fields, rec) {
    var errs = [];
    var label = String(fields.versionLabel || '').trim();
    if (!label) { errs.push({ field: 'vv-label', message: 'Enter a version label for this submission.' }); }
    else if (rec && label.toLowerCase() === String(rec.versionLabel || '').trim().toLowerCase()) {
      errs.push({ field: 'vv-label', message: 'This is the version label already published. Use a different one.' });
    }
    if (!String(fields.description || '').trim()) {
      errs.push({ field: 'vv-description', message: 'Describe the experiment as this version presents it.' });
    }
    if (!String(fields.changeNote || '').trim()) {
      errs.push({ field: 'vv-change', message: 'Say what changed in this version.' });
    }
    /* A later version reuses the SAME LABEL RULE as the first
       publication, against the released history too. Two releases under
       one label would make "which version is the public seeing?"
       unanswerable from the record. */
    if (rec && label) {
      /* Every label this Experiment has ever been public under: the one
         it carries now, every version released since, AND THE ONE IT
         WAS FIRST PUBLISHED UNDER — which stops being `rec.versionLabel`
         the moment a release overwrites it, and was therefore invisible
         to the check. */
      var used = releasedVersionsForRecord(rec.id).map(function (v) {
        return String(v.versionLabel || '').trim().toLowerCase();
      });
      publicationRecords().forEach(function (p) {
        if (p.recordId === rec.id && p.versionLabel) {
          used.push(String(p.versionLabel).trim().toLowerCase());
        }
      });
      var clash = used.indexOf(label.toLowerCase()) !== -1;
      if (clash) {
        errs.push({ field: 'vv-label', message: 'This experiment has already released a version with that label. Use a different one.' });
      }
    }
    /* A release writes this delivery onto the published Experiment, so
       it must meet the SAME format rule the first publication enforces.
       Without this a later version could release a hosted "link" that is
       not a link at all — a first submission cannot. The fields are
       optional on a version (an unchanged technology simply carries the
       published values forward); only a value that IS supplied is
       checked. */
    (rec ? rec.technologies : []).forEach(function (t) {
      var def = data.TECHNOLOGIES[t];
      if (!def || def.delivery !== 'hosted') { return; }
      var url = String((((fields.delivery || {})[t]) || {}).url || '').trim();
      if (url && !isHttpUrl(url)) {
        errs.push({ field: 'f-' + t + '-url',
          message: def.label + ': enter a valid http(s) URL, or leave it blank to keep the published link.' });
      }
    });
    return errs;
  }

  /* A later version exists only for an ALREADY-PUBLISHED Experiment, and
     only from a Vendor whose live role assignment covers it. */
  function vendorCanVersion(rec, actorId) {
    var actor = contentActor(actorId);
    if (!rec || !actor || actor.role !== CONTENT_ROLE.VENDOR) { return false; }
    if (rec.status !== CONTENT_STATUS.PUBLISHED) { return false; }
    return actorCoversRecord(actorId, rec);
  }
  function createContentVersion(actorId, recordId, fields) {
    var rec = contentRecord(recordId);
    var actor = contentActor(actorId);
    if (!vendorCanVersion(rec, actorId)) {
      return { ok: false, errors: [{ field: 'vv-label', message: 'This experiment is not in your assigned scope.' }], version: null };
    }
    if (openVersionForRecord(recordId)) {
      return { ok: false, errors: [{ field: 'vv-label',
        message: 'A later version of this experiment is already in the workflow. Only one at a time.' }], version: null };
    }
    var errs = validateVersion(fields, rec);
    if (errs.length) { return { ok: false, errors: errs, version: null }; }
    var now = new Date().toISOString();
    S.seq.contentVersion += 1;
    S.seq.event += 1;
    var v = {
      id: 'CV-' + util.pad3(S.seq.contentVersion),
      seq: S.seq.event,
      recordId: rec.id,
      /* what the public version WOULD become */
      versionLabel: String(fields.versionLabel || '').trim(),
      description: String(fields.description || '').trim(),
      summary: String(fields.summary || '').trim(),
      vendorNotes: String(fields.vendorNotes || '').trim(),
      changeNote: String(fields.changeNote || '').trim(),
      delivery: fields.delivery ? JSON.parse(JSON.stringify(fields.delivery)) : {},
      /* the version this candidate would replace, frozen at creation */
      replacesVersionLabel: rec.versionLabel || '',
      status: VERSION_STATUS.DRAFT,
      revision: 1,
      createdBy: actorId,
      createdByName: actor.name,
      createdAt: now,
      submittedAt: null,
      academicDecision: null,
      academicDecisionBy: null,
      academicDecisionAt: null,
      releaseDecision: null,
      history: []
    };
    S.contentVersions.push(v);
    pushVersionEvent(v, 'created', 'Later version drafted (' + v.versionLabel + ')', actor, '');
    save();
    return { ok: true, errors: [], version: v };
  }
  /* A later-version candidate follows the SAME rule as a first
     submission, from the same two questions — see
     `canViewHistoricalRecord` / `canMutateVendorRecord`.

     Viewing a candidate you created is OWNERSHIP: withdrawing a scope
     never hides a Vendor's own version, its change note or its history.
     Changing one needs a LIVE assignment covering the Experiment it is a
     version of, because a candidate carries the catalogue metadata and
     the per-technology package and hosted-link references that a release
     would write onto published content. */
  function canViewHistoricalVersion(v, actorId) {
    return !!v && !!actorId && v.createdBy === actorId;
  }
  function canMutateVendorVersion(v, actorId) {
    if (!canViewHistoricalVersion(v, actorId)) { return false; }
    if (v.status !== VERSION_STATUS.DRAFT && v.status !== VERSION_STATUS.CHANGES_ACADEMIC) { return false; }
    return actorCoversRecord(actorId, contentRecord(v.recordId));
  }
  /* Owned, lifecycle-open, but no longer covered — read-only because the
     scope went, not because someone else is holding it. */
  function versionScopeWithdrawn(v, actorId) {
    return canViewHistoricalVersion(v, actorId) &&
      !actorCoversRecord(actorId, contentRecord(v.recordId));
  }
  function versionEditableByVendor(v, actorId) { return canMutateVendorVersion(v, actorId); }
  function versionSubmittableByVendor(v, actorId) { return canMutateVendorVersion(v, actorId); }
  function updateContentVersion(actorId, versionId, fields) {
    var v = contentVersion(versionId);
    var actor = contentActor(actorId);
    if (!canMutateVendorVersion(v, actorId)) {
      return { ok: false, errors: [{ field: 'vv-label',
        message: versionScopeWithdrawn(v, actorId)
          ? 'This experiment is no longer in your assigned scope, so this version is read-only.'
          : 'This version is not open for editing.' }], version: null };
    }
    var errs = validateVersion(fields, contentRecord(v.recordId));
    if (errs.length) { return { ok: false, errors: errs, version: null }; }
    v.versionLabel = String(fields.versionLabel || '').trim();
    v.description = String(fields.description || '').trim();
    v.summary = String(fields.summary || '').trim();
    v.vendorNotes = String(fields.vendorNotes || '').trim();
    v.changeNote = String(fields.changeNote || '').trim();
    if (fields.delivery) { v.delivery = JSON.parse(JSON.stringify(fields.delivery)); }
    pushVersionEvent(v, 'metadata', 'Version updated', actor, '');
    save();
    return { ok: true, errors: [], version: v };
  }
  function submitContentVersion(actorId, versionId) {
    var v = contentVersion(versionId);
    var actor = contentActor(actorId);
    if (!canMutateVendorVersion(v, actorId)) { return null; }
    var resubmit = v.status === VERSION_STATUS.CHANGES_ACADEMIC;
    if (resubmit) { v.revision += 1; }
    v.status = VERSION_STATUS.ACADEMIC_REVIEW;
    v.submittedAt = new Date().toISOString();
    pushVersionEvent(v, resubmit ? 'resubmitted' : 'submitted',
      resubmit ? 'Resubmitted for academic review' : 'Submitted for academic review', actor, '');
    save();
    return v;
  }
  /* The academic decision on a later version. It APPROVES the version —
     it does not release it, and the public catalogue does not move. */
  function reviewerCanActOnVersion(v, actorId) {
    var actor = contentActor(actorId);
    if (!v || !actor || actor.role !== CONTENT_ROLE.REVIEWER) { return false; }
    if (v.status !== VERSION_STATUS.ACADEMIC_REVIEW) { return false; }
    return actorCoversRecord(actorId, contentRecord(v.recordId));
  }
  /* Which versions a reviewer may READ. `versionsForReviewer` already
     excludes DRAFT from the queue, but the queue is not the boundary —
     a hand-typed address is. A DRAFT candidate has not been submitted:
     the Vendor is told plainly that saving "keeps it with you", so it
     must not be readable by the next role in the chain until they send
     it. Everything from submission onward stays readable for good, so a
     completed academic decision never becomes unviewable. */
  function reviewerCanViewVersion(v, actorId) {
    var actor = contentActor(actorId);
    if (!v || !actor || actor.role !== CONTENT_ROLE.REVIEWER) { return false; }
    if (v.status === VERSION_STATUS.DRAFT) { return false; }
    return actorCoversRecord(actorId, contentRecord(v.recordId));
  }
  function approveVersionAcademic(actorId, versionId, comment) {
    var v = contentVersion(versionId);
    var actor = contentActor(actorId);
    if (!reviewerCanActOnVersion(v, actorId)) { return null; }
    var now = new Date().toISOString();
    v.status = VERSION_STATUS.APPROVED;
    v.academicDecision = 'approved';
    v.academicDecisionBy = actorId;
    v.academicDecisionByName = actor.name;
    v.academicDecisionAt = now;
    pushVersionEvent(v, 'approved', 'Academically approved — awaiting the Super Admin Release / Hold decision',
      actor, String(comment || '').trim());
    save();
    return v;
  }
  function requestChangesVersionAcademic(actorId, versionId, comment) {
    var v = contentVersion(versionId);
    var actor = contentActor(actorId);
    if (!reviewerCanActOnVersion(v, actorId)) { return null; }
    var text = String(comment || '').trim();
    if (!text) { return null; }
    v.status = VERSION_STATUS.CHANGES_ACADEMIC;
    v.academicDecision = 'changes';
    v.academicDecisionBy = actorId;
    v.academicDecisionByName = actor.name;
    v.academicDecisionAt = new Date().toISOString();
    pushVersionEvent(v, 'changes', 'Changes requested — academic review', actor, text);
    save();
    return v;
  }

  /* THE SUPER ADMIN DECISION. Only an APPROVED candidate can reach it. */
  function versionAwaitingDecision(v) { return !!v && v.status === VERSION_STATUS.APPROVED; }

  /* RELEASE — the ONLY thing in the whole build that changes the public
     version of an already-published Experiment.

     It writes the record's own catalogue fields and its version label,
     under the SAME experiment id. It creates no access record, changes
     no licence quantity, creates no assignment, and — deliberately —
     does not touch `rec.technologies`, so an existing tenant's granted
     technology variants cannot be widened or narrowed by a release. */
  function releaseVersion(versionId, note) {
    var v = contentVersion(versionId);
    if (!versionAwaitingDecision(v)) { return null; }
    var rec = contentRecord(v.recordId);
    if (!rec || rec.status !== CONTENT_STATUS.PUBLISHED) { return null; }
    var now = new Date().toISOString();
    var previousLabel = rec.versionLabel || '';

    rec.description = v.description;
    if (v.summary) { rec.summary = v.summary; }
    if (v.vendorNotes) { rec.vendorNotes = v.vendorNotes; }
    rec.versionLabel = v.versionLabel;
    /* Per-technology delivery references, for technologies the record
       already carries. A version can correct a package reference or a
       hosted link; it can never introduce a technology. */
    /* MERGE, never replace. A candidate carries the fields the version
       form offers; the published record may hold more (a recorded package
       file, installation notes, technical notes) that the form never
       asks about. Replacing the object wholesale would silently discard
       them, and an empty field in the candidate would blank a working
       hosted link. So only values the candidate actually supplies are
       written. */
    Object.keys(v.delivery || {}).forEach(function (tech) {
      if (rec.technologies.indexOf(tech) === -1) { return; }
      var incoming = v.delivery[tech] || {};
      var current = rec.delivery[tech] || {};
      var merged = JSON.parse(JSON.stringify(current));
      Object.keys(incoming).forEach(function (field) {
        var val = incoming[field];
        if (typeof val === 'string' && !val.trim()) { return; }
        if (val === null || val === undefined) { return; }
        merged[field] = val;
      });
      rec.delivery[tech] = merged;
    });
    rec.updatedAt = now;
    rec.currentVersionId = v.id;

    v.status = VERSION_STATUS.RELEASED;
    v.releaseDecision = {
      decision: 'released', by: 'Super Admin', at: now,
      note: String(note || '').trim(), replacedVersionLabel: previousLabel
    };
    pushVersionEvent(v, 'released', 'Released as the current version (' + v.versionLabel + ')',
      null, String(note || '').trim());
    pushContentEvent(rec, 'released',
      'Version ' + v.versionLabel + ' released' + (previousLabel ? ' — replaces ' + previousLabel : ''),
      PLATFORM_ACTOR, now, String(note || '').trim());
    save();
    return v;
  }

  /* HOLD — the currently published version stays live, unchanged.

     The candidate is parked, not discarded: STK31-22 prefers a
     reversible state, and no source says a held version is abandoned.
     The Super Admin can release it later, or the Vendor can supersede it
     by having it returned academically. */
  function holdVersion(versionId, note) {
    var v = contentVersion(versionId);
    if (!versionAwaitingDecision(v)) { return null; }
    var rec = contentRecord(v.recordId);
    var now = new Date().toISOString();
    v.status = VERSION_STATUS.HELD;
    v.releaseDecision = { decision: 'held', by: 'Super Admin', at: now, note: String(note || '').trim() };
    pushVersionEvent(v, 'held', 'Held — the current published version stays live', null, String(note || '').trim());
    if (rec) {
      pushContentEvent(rec, 'held',
        'Version ' + v.versionLabel + ' held — published version ' + (rec.versionLabel || '—') + ' remains current',
        PLATFORM_ACTOR, now, String(note || '').trim());
    }
    save();
    return v;
  }
  /* A held candidate returns to the decision queue. Reversible, and the
     release itself still goes through releaseVersion(). */
  function returnHeldVersionToDecision(versionId, note) {
    var v = contentVersion(versionId);
    if (!v || v.status !== VERSION_STATUS.HELD) { return null; }
    v.status = VERSION_STATUS.APPROVED;
    v.releaseDecision = null;
    pushVersionEvent(v, 'reopened', 'Hold lifted — returned to the Release / Hold decision', null,
      String(note || '').trim());
    save();
    return v;
  }

  /* ============================================================
     DEVICE REPLACEMENT / TRANSFER  (STK31-38 · FRD 2.4.1 / 2.4.2)

     Student requests → the INSTITUTE / TENANT ADMIN reviews and
     forwards → Super Admin approves → the authorised device binding
     changes.

     The middle step is stakeholder-confirmed (Implementation 07.2):
     "Any request from institution should come through Tenant Admin. He
      will be our POC to facilitate and final approval comes to Super
      Admin." The Super Admin remains the FINAL decision maker; what
     changed is that a Student no longer reaches them directly.

     ⚠ TWO GAPS, SHOWN AS GAPS AND NOT INVENTED — both recorded in
     `11_XR_DELIVERY_AND_DEVICE_MODEL.md` §6:
       1 · There is NO device registry anywhere in the sources. The
           binding exists as a relationship, not an administrable record,
           so the request carries plain device labels the Student types
           and the prototype certifies no hardware, model or
           compatibility.
       2 · The requirement contains NO rejection behaviour. A decline
           path is implemented here because this implementation was asked
           for one; it is an IMPLEMENTATION JUDGEMENT, recorded as one,
           and is not stakeholder-confirmed.

     WHAT APPROVAL DOES NOT DO: it consumes no licence, grants no
     Experiment, adds no technology, and touches no assessment state.
     It writes the request record and nothing else — which is why
     `accessAllocation()` and `entitlementsForStudent()` cannot see it.
     ============================================================ */

  var TRANSFER_STATUS = {
    SUBMITTED: 'submitted',
    /* Implementation 07.2 — the Tenant Admin has reviewed the request
       and forwarded it. Only from here is it the Super Admin's to
       decide. */
    ESCALATED: 'escalated',
    APPROVED: 'approved',
    DECLINED: 'declined'
  };
  /* The two states in which a request is still IN FLIGHT. Read by the
     one-open-request guard, so adding the escalated state cannot let a
     Student raise a second request describing a second device while the
     first is still moving. */
  var TRANSFER_OPEN = [TRANSFER_STATUS.SUBMITTED, TRANSFER_STATUS.ESCALATED];
  var TRANSFER_STATUS_META = {
    submitted: { label: 'Awaiting Institute Admin review',  badge: 'b-info',    icon: 'clock' },
    escalated: { label: 'Forwarded — awaiting Super Admin', badge: 'b-warning', icon: 'clock' },
    approved:  { label: 'Approved',                         badge: 'b-success', icon: 'check' },
    declined:  { label: 'Declined',                         badge: 'b-danger',  icon: 'x' }
  };
  function transferStatusMeta(status) {
    return TRANSFER_STATUS_META[status] || { label: status, badge: 'b-neutral', icon: 'circle' };
  }

  function deviceTransferRequests() { return S.deviceTransferRequests; }
  function deviceTransferById(id) {
    return S.deviceTransferRequests.filter(function (r) { return r.id === id; })[0] || null;
  }
  function transfersForStudent(personId) {
    return S.deviceTransferRequests.filter(function (r) { return r.personId === personId; })
      .sort(function (a, b) { return (b.seq || 0) - (a.seq || 0); });
  }
  function transferIsOpen(rec) {
    return !!rec && TRANSFER_OPEN.indexOf(rec.status) !== -1;
  }
  function openTransferForStudent(personId) {
    return S.deviceTransferRequests.filter(function (r) {
      return r.personId === personId && transferIsOpen(r);
    })[0] || null;
  }
  /* THE SUPER ADMIN'S QUEUE — Implementation 07.2, stakeholder rule C.

     "Any request from institution should come through Tenant Admin. He
      will be our POC to facilitate and final approval comes to Super
      Admin."

     This one filter is what stops a Student reaching the Super Admin
     directly. A newly raised request is `submitted`, which now means
     "with the Institute / Tenant Admin"; it becomes the platform's to
     decide only once the Tenant Admin has forwarded it. Every Super
     Admin count, badge and attention row derives from here, so they all
     move together and none of them can disagree. */
  function transfersAwaitingDecision() {
    return S.deviceTransferRequests.filter(function (r) { return r.status === TRANSFER_STATUS.ESCALATED; })
      .sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
  }
  /* The INSTITUTION's queue — what its own Tenant Admin has to look at.
     Oldest first, the same ordering the platform queue uses. */
  function transfersAwaitingTenant(tenantId) {
    return S.deviceTransferRequests.filter(function (r) {
      return r.tenantId === tenantId && r.status === TRANSFER_STATUS.SUBMITTED;
    }).sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
  }
  /* Every device request raised inside one institution, newest first —
     the Tenant Admin sees the outcome of the ones they forwarded, not
     only the ones still waiting. */
  function transfersForTenant(tenantId) {
    return S.deviceTransferRequests.filter(function (r) { return r.tenantId === tenantId; })
      .sort(function (a, b) { return (b.seq || 0) - (a.seq || 0); });
  }
  /* Device transfer is meaningful only where the technology is delivered
     as an authorised PACKAGE on a device (AR / VR / MR). A hosted Web
     experience has no device binding to move (STK31-37). */
  function isPackageTechnology(tech) {
    var def = data.TECHNOLOGIES[tech];
    return !!def && def.delivery === 'package';
  }
  function packageTechnologiesForStudent(personId) {
    var set = {};
    studentExperiments(personId).forEach(function (row) {
      if (!row.effective) { return; }
      row.technologies.forEach(function (t) { if (isPackageTechnology(t)) { set[t] = true; } });
    });
    return data.sortTech(Object.keys(set));
  }
  /* Whether this Student has a device binding AT ALL — including through an
     entitlement that is currently blocked. A Student whose institution has
     just been deactivated still has a device; they simply cannot act on it
     this minute. The destination and the empty state read this, so they say
     "your institution is suspended" rather than the plainly wrong "nothing
     you hold runs on a device". Raising a request still requires an
     EFFECTIVE entitlement, which is the function above. */
  function studentHasPackageTechnology(personId) {
    return studentExperiments(personId).some(function (row) {
      return row.technologies.concat(row.blockedTechnologies).some(isPackageTechnology);
    });
  }
  function studentCanRequestTransfer(personId) {
    return personCanWrite(personId) && packageTechnologiesForStudent(personId).length > 0;
  }

  function validateTransfer(personId, fields) {
    var errs = [];
    if (!String(fields.currentDevice || '').trim()) {
      errs.push({ field: 'dt-current', message: 'Describe the device you are using now.' });
    }
    if (!String(fields.newDevice || '').trim()) {
      errs.push({ field: 'dt-new', message: 'Describe the replacement device.' });
    }
    if (!String(fields.reason || '').trim()) {
      errs.push({ field: 'dt-reason', message: 'Say why the device needs to be replaced.' });
    }
    var techs = packageTechnologiesForStudent(personId);
    if (fields.technology && techs.indexOf(fields.technology) === -1) {
      errs.push({ field: 'dt-tech', message: 'Choose a technology your institution has made available to you on a device.' });
    }
    return errs;
  }

  function createDeviceTransfer(personId, fields) {
    var p = personById(personId);
    if (!p || p.role !== 'student') {
      return { ok: false, errors: [{ field: 'dt-current', message: 'This student record no longer exists.' }], request: null };
    }
    if (!tenantCanWrite(p.tenantId)) {
      return { ok: false, errors: [{ field: 'dt-current', message: TENANT_INACTIVE_TEXT }], request: null };
    }
    if (!packageTechnologiesForStudent(personId).length) {
      return { ok: false, errors: [{ field: 'dt-current',
        message: 'You hold no experiment that runs from an authorised package on a device, so there is no device binding to transfer.' }], request: null };
    }
    /* One open request at a time — a second submission while one is
       still awaiting a decision would create two competing bindings. */
    if (openTransferForStudent(personId)) {
      return { ok: false, errors: [{ field: 'dt-current',
        message: 'You already have a device transfer request awaiting a decision.' }], request: null };
    }
    var errs = validateTransfer(personId, fields);
    if (errs.length) { return { ok: false, errors: errs, request: null }; }
    var now = new Date().toISOString();
    S.seq.transfer += 1;
    S.seq.event += 1;
    var rec = {
      id: 'DTR-' + util.pad3(S.seq.transfer),
      seq: S.seq.event,
      personId: personId,
      personName: p.name,
      tenantId: p.tenantId,
      /* WHAT THE REQUEST IS ABOUT — RESOLVED AT SUBMISSION TIME.

         The form offers "— all of them —", which means "every technology
         I hold that is bound to a device". That is a real, answerable
         question, and the answer belongs in the record: storing it as a
         bare null made the request indistinguishable from "the Student
         did not say", so a request that unambiguously concerned the
         Student's one VR headset reached the Super Admin deciding it as
         `Technology: Not specified`.

         `scope` keeps WHAT THE STUDENT CHOSE, so the meaning of "all of
         them" is preserved rather than rewritten into a specific pick.
         `technologies` is the resolved set — never invented, always the
         Student's own effective package technologies, snapshotted now so
         a later entitlement change cannot silently re-scope a request
         that has already been decided.
         `technology` is the single-value convenience, set ONLY when the
         set has exactly one member. Where several device-based
         technologies genuinely apply it stays null and the surfaces list
         the set, rather than silently choosing one of them. */
      scope: fields.technology ? 'specific' : 'all',
      technologies: fields.technology
        ? [fields.technology]
        : packageTechnologiesForStudent(personId),
      technology: null,
      currentDevice: String(fields.currentDevice || '').trim(),
      newDevice: String(fields.newDevice || '').trim(),
      reason: String(fields.reason || '').trim(),
      status: TRANSFER_STATUS.SUBMITTED,
      decidedBy: null, decidedAt: null, decisionNote: '',
      createdAt: now,
      history: [{ seq: S.seq.event, kind: 'submitted', label: 'Transfer requested',
                  who: p.name, at: now, note: '' }]
    };
    rec.technology = rec.technologies.length === 1 ? rec.technologies[0] : null;
    S.deviceTransferRequests.push(rec);
    save();
    return { ok: true, errors: [], request: rec };
  }

  /* The technologies a request covers, for ANY record — including one
     written before the scope was resolved at submission. One reader, so
     the Student's page, the Operations queue and the request detail
     cannot drift apart on the answer. */
  function transferTechnologies(rec) {
    if (!rec) { return []; }
    if (Array.isArray(rec.technologies) && rec.technologies.length) { return rec.technologies.slice(); }
    return rec.technology ? [rec.technology] : [];
  }
  /* True when the Student asked about every device-bound technology they
     hold rather than naming one. Legacy records carry no `scope`; a null
     technology on one of those meant exactly this. */
  function transferCoversAll(rec) {
    if (!rec) { return false; }
    return rec.scope ? rec.scope === 'all' : !rec.technology;
  }

  /* ============================================================
     THE INSTITUTION POC HOP — Implementation 07.2, stakeholder rule C.

     Student → INSTITUTE / TENANT ADMIN → Super Admin → decision.

     The Tenant Admin is the institution's point of contact: they see
     the request first, facilitate it, and forward it. Only a forwarded
     request is the Super Admin's to decide.

     ⚠ WHAT THIS FUNCTION WRITES: the status, the three escalation
     fields and ONE history entry, on THIS RECORD. Nothing else. It
     consumes no licence, grants no Experiment, adds no technology,
     touches no assignment and touches no assessment state — the same
     guarantee `decideDeviceTransfer` gives, and for the same reason: a
     device is a delivery relationship, not an entitlement.

     ⚠ NO DEVICE REGISTRY IS INTRODUCED. The escalation note is plain
     free text, exactly like the decision note. There is no serial
     number, no model validation, no MDM, no hardware certification and
     no authentication step anywhere on this path.

     ⚠ NOTHING IS SENT. This build has no notification channel of any
     kind and does not pretend to: the state is surfaced in the product
     to both the Student and the Tenant Admin, and no surface claims a
     message was delivered.
     ============================================================ */
  function escalateDeviceTransfer(id, note) {
    var rec = deviceTransferById(id);
    if (!rec || rec.status !== TRANSFER_STATUS.SUBMITTED) { return null; }
    /* The same tenant-plane write guard every other Tenant Admin writer
       meets. A deactivated institution cannot forward — and, exactly as
       everywhere else, nothing is lost: the request stays where it is
       and moves the moment the institution is reactivated. */
    if (!tenantCanWrite(rec.tenantId)) { return null; }
    /* THE ACTOR MUST BE REAL. An institution with no assigned Tenant
       Admin genuinely cannot perform the POC step — the Super Admin
       Overview already flags that institution — and fabricating an
       actor to get past it would put a name on the audit trail that
       belongs to nobody. */
    var admin = actingTenantAdmin(rec.tenantId);
    if (!admin) { return null; }
    var text = String(note || '').trim();
    var now = new Date().toISOString();
    rec.status = TRANSFER_STATUS.ESCALATED;
    rec.escalatedBy = admin.name;
    rec.escalatedAt = now;
    rec.escalationNote = text;
    S.seq.event += 1;
    rec.history.push({
      seq: S.seq.event,
      kind: 'escalated',
      label: 'Reviewed by the Institute / Tenant Admin and forwarded to the Super Admin',
      who: admin.name, at: now, note: text
    });
    save();
    return rec;
  }

  /* The FINAL decision, and it stays the Super Admin's. It writes THIS
     RECORD ONLY.

     The guard is `ESCALATED`, not `SUBMITTED`: a request the institution
     has not forwarded is not the platform's to decide. */
  function decideDeviceTransfer(id, decision, note) {
    var rec = deviceTransferById(id);
    if (!rec || rec.status !== TRANSFER_STATUS.ESCALATED) { return null; }
    if (decision !== TRANSFER_STATUS.APPROVED && decision !== TRANSFER_STATUS.DECLINED) { return null; }
    var text = String(note || '').trim();
    if (decision === TRANSFER_STATUS.DECLINED && !text) { return null; }
    var now = new Date().toISOString();
    rec.status = decision;
    rec.decidedBy = 'Super Admin';
    rec.decidedAt = now;
    rec.decisionNote = text;
    S.seq.event += 1;
    rec.history.push({
      seq: S.seq.event,
      kind: decision === TRANSFER_STATUS.APPROVED ? 'approved' : 'declined',
      label: decision === TRANSFER_STATUS.APPROVED
        ? 'Approved — the authorised device binding moves to the replacement device'
        : 'Declined',
      who: 'Super Admin', at: now, note: text
    });
    save();
    return rec;
  }

  /* ============================================================
     SUPPORT / HELP  (STK31-39)

     Report a technical issue → it appears in the platform queue →
     Super Admin resolves it → the reporter sees the state.

     ⛔ Deliberately absent, all four explicitly prohibited by STK31-39:
     an SLA, a priority formula, an external ticket provider, a chatbot.
     There is also no notification of any kind: no source describes one
     for support, so status is surfaced in the product and nothing claims
     a message was sent.

     A support ticket changes NO entitlement, NO licence, NO assignment
     and NO content state. It only ever writes its own record.
     ============================================================ */

  var SUPPORT_STATUS = { OPEN: 'open', RESOLVED: 'resolved' };
  var SUPPORT_STATUS_META = {
    open:     { label: 'Open',     badge: 'b-info',    icon: 'clock' },
    resolved: { label: 'Resolved', badge: 'b-success', icon: 'check' }
  };
  function supportStatusMeta(status) {
    return SUPPORT_STATUS_META[status] || { label: status, badge: 'b-neutral', icon: 'circle' };
  }
  /* The confirmed issue kinds, verbatim from STK31-39. Nothing is added
     to this list and nothing is scored or prioritised by it. */
  var SUPPORT_CATEGORIES = [
    { id: 'experiment', label: 'Experiment not opening' },
    { id: 'package',    label: 'Package / link issue' },
    { id: 'login',      label: 'Login issue' },
    { id: 'access',     label: 'Access issue' },
    { id: 'device',     label: 'Device issue' },
    { id: 'other',      label: 'Other technical issue' }
  ];
  function supportCategoryLabel(id) {
    var c = SUPPORT_CATEGORIES.filter(function (x) { return x.id === id; })[0];
    return c ? c.label : 'Other technical issue';
  }

  function supportTickets() { return S.supportTickets; }
  function supportTicketById(id) {
    return S.supportTickets.filter(function (t) { return t.id === id; })[0] || null;
  }
  function ticketsForRequester(kind, requesterId) {
    return S.supportTickets.filter(function (t) {
      return t.requesterKind === kind && t.requesterId === requesterId;
    }).sort(function (a, b) { return (b.seq || 0) - (a.seq || 0); });
  }
  function openSupportTickets() {
    return S.supportTickets.filter(function (t) { return t.status === SUPPORT_STATUS.OPEN; })
      .sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
  }
  function ticketsForTenant(tenantId) {
    return S.supportTickets.filter(function (t) { return t.tenantId === tenantId; });
  }

  function validateSupportTicket(fields) {
    var errs = [];
    if (!String(fields.subject || '').trim()) {
      errs.push({ field: 'sp-subject', message: 'Give the issue a short title.' });
    }
    if (!SUPPORT_CATEGORIES.some(function (c) { return c.id === fields.category; })) {
      errs.push({ field: 'sp-category', message: 'Choose the kind of issue you are reporting.' });
    }
    if (!String(fields.description || '').trim()) {
      errs.push({ field: 'sp-description', message: 'Describe what you were doing and what happened.' });
    }
    return errs;
  }

  /* `context` carries only what the platform ALREADY knows about the
     reporter — identity, role, tenant, and the experiment/technology
     they were on where that applies (STK31-39 §1.2). Nothing is
     fabricated and nothing is collected that the product does not hold. */
  function createSupportTicket(context, fields) {
    var errs = validateSupportTicket(fields);
    if (errs.length) { return { ok: false, errors: errs, ticket: null }; }
    var now = new Date().toISOString();
    S.seq.ticket += 1;
    S.seq.event += 1;
    var rec = {
      id: 'SUP-' + util.pad3(S.seq.ticket),
      seq: S.seq.event,
      requesterKind: context.kind,          /* student · faculty · tenant-admin · vendor · reviewer · manager */
      requesterId: context.id || null,
      requesterName: context.name || 'Unknown',
      requesterRoleLabel: context.roleLabel || '',
      tenantId: context.tenantId || null,
      experimentId: fields.experimentId || null,
      technology: fields.technology || null,
      category: fields.category,
      subject: String(fields.subject || '').trim(),
      description: String(fields.description || '').trim(),
      status: SUPPORT_STATUS.OPEN,
      resolutionNote: '', resolvedBy: null, resolvedAt: null,
      createdAt: now,
      history: [{ seq: S.seq.event, kind: 'submitted', label: 'Issue reported',
                  who: context.name || 'Unknown', at: now, note: '' }]
    };
    S.supportTickets.push(rec);
    save();
    return { ok: true, errors: [], ticket: rec };
  }

  function resolveSupportTicket(id, note) {
    var rec = supportTicketById(id);
    if (!rec || rec.status !== SUPPORT_STATUS.OPEN) { return null; }
    var text = String(note || '').trim();
    if (!text) { return null; }
    var now = new Date().toISOString();
    rec.status = SUPPORT_STATUS.RESOLVED;
    rec.resolutionNote = text;
    rec.resolvedBy = 'Super Admin';
    rec.resolvedAt = now;
    S.seq.event += 1;
    rec.history.push({ seq: S.seq.event, kind: 'resolved', label: 'Resolved',
                       who: 'Super Admin', at: now, note: text });
    save();
    return rec;
  }
  /* A resolved ticket can be reopened — the reporter's problem may not
     have gone away, and STK31-22 prefers reversible over final. */
  function reopenSupportTicket(id, note) {
    var rec = supportTicketById(id);
    if (!rec || rec.status !== SUPPORT_STATUS.RESOLVED) { return null; }
    var now = new Date().toISOString();
    rec.status = SUPPORT_STATUS.OPEN;
    /* The previous resolution stays in the HISTORY, where it belongs, and
       stops being the report's current resolution — otherwise an open
       report would still render a Resolution block claiming it was
       dealt with. */
    rec.previousResolution = rec.resolutionNote;
    rec.resolutionNote = '';
    rec.resolvedBy = null; rec.resolvedAt = null;
    S.seq.event += 1;
    rec.history.push({ seq: S.seq.event, kind: 'reopened', label: 'Reopened',
                       who: 'Super Admin', at: now, note: String(note || '').trim() });
    save();
    return rec;
  }

  /* ============================================================
     THE 15-DAY EXPIRY REMINDER  (STK31-28)

     The stakeholder stated it verbatim: "We will send reminders to
     Tenants 15 days ahead." The REQUIREMENT is the reminder. The
     DELIVERY CHANNEL is pending (ND-16) and is explicitly not to be
     invented — not e-mail, not SMS, not push, not a provider.

     So this build implements the RULE and an honest in-product
     representation of it, and claims nothing was sent:

       reminder is DUE  ⇔  the access term is still running
                           AND daysUntilExpiry <= 15

     `util.daysUntil` rounds up, so the boundary is INCLUSIVE at exactly
     15 days (16 days out → not due; 15 days out → due; 10 days out →
     due; past the end instant → expired, not "due"). The same
     derivation feeds the Tenant Admin's "Expiring soon" state and the
     Super Admin's operational list — one rule, two audiences, no stored
     duplicate that could drift.

     No auto-renewal, no automatic payment, no automatic extension
     (STK31-28), and no Student-facing renewal control anywhere.
     ============================================================ */

  var EXPIRY_REMINDER_DAYS = 15;

  function accessDaysUntilExpiry(rec) {
    if (!rec || !rec.endsOn) { return null; }
    var end = new Date(rec.endsOn).getTime();
    if (isNaN(end)) { return null; }
    return util.daysUntil(rec.endsOn);
  }
  /* The rule itself, in one place. */
  function expiryReminderDue(rec) {
    if (!rec || !rec.endsOn) { return false; }
    if (!accessIsLive(rec)) { return false; }          /* already expired — not a reminder */
    var days = accessDaysUntilExpiry(rec);
    return days != null && days <= EXPIRY_REMINDER_DAYS;
  }
  /* ⚠ PROTOTYPE-ONLY, AND NOT A PRODUCT CAPABILITY.

     The 15-day reminder rule is stakeholder-confirmed (STK31-28) and is
     asserted at its boundary in `qa/checks.js`, but no ACTION in the
     product can produce the state: the shortest access term a request
     can carry is Monthly, so a freshly activated record is ~30 days out
     and a reviewer cannot reach T-15 by using the product. That made a
     confirmed requirement invisible in a functional walkthrough.

     This moves ONE access record's end date and nothing else. It grants
     nothing, changes no quantity, no item, no assignment and no
     entitlement, and it does not renew or extend anything in the product
     sense — it is the equivalent of winding the demo clock forward, and
     every surface that offers it says exactly that. There is no
     corresponding product control anywhere, and no source implies one. */
  function protoSetAccessEnd(accessId, daysFromNow) {
    var rec = accessById(accessId);
    if (!rec) { return null; }
    var n = Number(daysFromNow);
    if (isNaN(n)) { return null; }
    rec.endsOn = util.addDays(new Date().toISOString(), n);
    save();
    return rec;
  }

  function accessNeedingExpiryReminder() {
    return S.access.filter(expiryReminderDue)
      .sort(function (a, b) {
        return (accessDaysUntilExpiry(a) || 0) - (accessDaysUntilExpiry(b) || 0);
      });
  }
  function tenantAccessNeedingExpiryReminder(tenantId) {
    return accessForTenant(tenantId).filter(expiryReminderDue);
  }
  function expiredAccessForTenant(tenantId) {
    return accessForTenant(tenantId).filter(function (rec) { return !accessIsLive(rec); });
  }

  /* ---------- the Super Admin operational read model ----------
     Every number below is derived from real records. There is no stored
     KPI, no sample figure, and nothing that cannot be opened. */
  function platformOverview() {
    var submitted = S.requests.filter(function (r) { return r.status === STATUS.SUBMITTED; });
    var awaitingPayment = S.requests.filter(function (r) { return r.status === STATUS.APPROVED_PAYMENT_REQUIRED; });
    var activeTenants = S.tenants.filter(function (t) { return t.status !== 'inactive'; });
    var inactiveTenants = S.tenants.filter(function (t) { return t.status === 'inactive'; });
    var reminders = accessNeedingExpiryReminder();
    var expired = S.access.filter(function (rec) { return !accessIsLive(rec); });
    return {
      requestsAwaiting: submitted,
      requestsAwaitingPayment: awaitingPayment,
      tenants: S.tenants.slice(),
      activeTenants: activeTenants,
      inactiveTenants: inactiveTenants,
      tenantsWithoutAdmin: tenantsWithoutAdmin(),
      versionsAwaiting: versionsAwaitingDecision(),
      versionsHeld: versionsOnHold(),
      transfersAwaiting: transfersAwaitingDecision(),
      ticketsOpen: openSupportTickets(),
      expiryReminders: reminders,
      expiredAccess: expired,
      accessRecords: S.access.length,
      publishedCount: S.contentRecords.filter(function (r) { return r.status === CONTENT_STATUS.PUBLISHED; }).length,
      roleAssignments: roleAssignments({}).length,
      /* Implementation 07.1 — the canonical structure the platform now owns. */
      groupings: S.groupings.length,
      courses: S.courses.length
    };
  }

  /* One tenant's operational picture, for the institution report
     (STK31-42). Operational facts only — no revenue metric exists here
     and none may be invented. */
  function tenantReport(tenantId) {
    var t = tenantById(tenantId);
    if (!t) { return null; }
    var access = accessForTenant(tenantId);
    var people = peopleForTenant(tenantId);
    var students = people.filter(function (p) { return p.role === 'student'; });
    var faculty = people.filter(function (p) { return p.role === 'faculty'; });
    var courseIds = {};
    var experimentIds = {};
    access.forEach(function (rec) {
      (rec.items || []).forEach(function (i) {
        experimentIds[i.experimentId] = true;
        var ctx = data.contextOf(i.experimentId);
        if (ctx && ctx.course) { courseIds[ctx.course.id] = true; }
      });
    });
    var groupingIds = {};
    Object.keys(courseIds).forEach(function (cid) {
      var c = data.course(cid);
      if (c) { groupingIds[c.groupingId] = true; }
    });

    /* ---- STK31-42, the two lines the report was missing ----
       "students/users by stream where available" and "usage / completion
       indicators". Both are DERIVED from records that already exist; no
       figure below is stored, estimated or scored, and each states its
       own numerator and denominator on the screen (PM-11 / STK31-29
       forbid a composite index, rank or prediction). */
    var byStream = {};
    students.forEach(function (p) {
      var m = studentCourseMembership(p.id);
      var key = m && m.grouping ? m.grouping.id : '__none';
      if (!byStream[key]) {
        byStream[key] = { id: key, name: m && m.grouping ? m.grouping.name : null, students: 0, active: 0 };
      }
      byStream[key].students += 1;
      if (p.status === 'active') { byStream[key].active += 1; }
    });

    /* Usage is counted over EFFECTIVE ENTITLEMENTS, because an
       entitlement is the only thing a student can actually use. A
       student entitled to three experiments counts three times here,
       and the denominator says so. */
    var usage = { entitlements: 0, started: 0, completed: 0, awaitingReview: 0, studentsStarted: 0, students: 0 };
    var startedStudents = {};
    students.forEach(function (p) {
      if (p.status !== 'active') { return; }
      var ents = getEffectiveStudentEntitlements(p.id);
      if (!ents.length) { return; }
      usage.students += 1;
      /* ONE ROW PER STUDENT x EXPERIMENT, not per entitlement.
         `getEffectiveStudentEntitlements` returns one row per Student x
         Experiment x ACCESS RECORD, so a tenant holding the same
         Experiment on two records counted that student's single piece of
         work twice — and `experimentProgress` is Experiment-level, so
         the second count was a copy of the first, not a second fact.
         The technologies are unioned across the records, because that is
         what the student can actually run. */
      var byExp = {};
      ents.forEach(function (e) {
        if (!byExp[e.experimentId]) { byExp[e.experimentId] = []; }
        (e.technologies || []).forEach(function (t) {
          if (byExp[e.experimentId].indexOf(t) === -1) { byExp[e.experimentId].push(t); }
        });
      });
      Object.keys(byExp).forEach(function (experimentId) {
        usage.entitlements += 1;
        var pr = experimentProgress(p.id, experimentId, byExp[experimentId]);
        if (pr.status !== TECH_PROGRESS.NOT_STARTED) { usage.started += 1; startedStudents[p.id] = true; }
        if (pr.status === TECH_PROGRESS.COMPLETED) { usage.completed += 1; }
        if (pr.status === TECH_PROGRESS.PENDING_REVIEW) { usage.awaitingReview += 1; }
      });
    });
    usage.studentsStarted = Object.keys(startedStudents).length;

    return {
      byStream: Object.keys(byStream).map(function (k) { return byStream[k]; })
        .sort(function (a, b) { return b.students - a.students; }),
      usage: usage,
      tenant: t,
      status: tenantStatusMeta(t),
      admins: tenantAdminsFor(tenantId),
      allAdmins: allTenantAdminsFor(tenantId),
      access: access,
      liveAccess: access.filter(accessIsLive),
      allocation: tenantAllocation(tenantId),
      people: people.length,
      students: students.length,
      activeStudents: students.filter(function (p) { return p.status === 'active'; }).length,
      faculty: faculty.length,
      groups: groupsForTenant(tenantId).length,
      courseIds: Object.keys(courseIds),
      experimentIds: Object.keys(experimentIds),
      groupingIds: Object.keys(groupingIds),
      entitledStudents: entitledStudentIds(tenantId).length,
      expiryReminders: tenantAccessNeedingExpiryReminder(tenantId),
      expiredAccess: expiredAccessForTenant(tenantId),
      openTickets: ticketsForTenant(tenantId).filter(function (x) { return x.status === SUPPORT_STATUS.OPEN; }),
      transfers: S.deviceTransferRequests.filter(function (r) { return r.tenantId === tenantId; })
    };
  }

  /* ---------- migration into schema 7 ----------
     Additive at every point. Every request, tenant, access record,
     person, group, mapping, assignment, learning record, question,
     assessment, review and content record written by an Implementation
     01–05 build survives untouched; this only adds the governance fields
     and collections around them. */
  /* SCHEMA 7 → 8: a device transfer request records WHICH technologies
     it covers, instead of leaving "all of them" as an unreadable null.

     Deliberately NOT guarded on the stored version. The defect this
     repairs produced records inside schema 7 itself, so a version guard
     would leave exactly the requests that need fixing unfixed. It is
     presence-guarded and idempotent instead, so it runs once on any
     state that needs it and never touches one that does not.

     NOTHING IS INVENTED. A record that named a technology keeps it. A
     record that meant "all of them" is resolved against THAT STUDENT'S
     OWN device-based technologies — the same set the form offered them —
     and if that cannot be resolved (the person is gone, or holds none)
     the record is left with an empty set and still reads honestly as
     "Not specified" rather than being guessed at. No decision, note,
     device description or history entry is altered. */
  function migrateTransferScope(parsed) {
    var byId = {};
    (parsed.people || []).forEach(function (p) { byId[p.id] = p; });
    (parsed.deviceTransferRequests || []).forEach(function (r) {
      if (Array.isArray(r.technologies)) { return; }
      if (r.technology) {
        r.scope = 'specific';
        r.technologies = [r.technology];
        return;
      }
      /* An "all of them" record. The SET cannot be resolved here: this
         runs before `S` exists, and re-deriving entitlement from raw
         parsed rows would be a second, divergent copy of the entitlement
         engine — exactly the kind of duplicate rule this build avoids.
         It is marked and left empty, and `resolveTransferScopes()`
         fills it in immediately after load using the real engine. */
      r.scope = 'all';
      r.technologies = [];
    });
  }

  /* The second half of the 7 → 8 migration, run once state is live so it
     can ask the ONE entitlement engine rather than reimplementing it.
     Idempotent: it only touches an "all" record whose set is still
     empty, and it writes nothing if the answer is empty too — a Student
     who holds no device-based technology keeps an honest blank rather
     than a fabricated one. */
  function resolveTransferScopes() {
    var changed = false;
    S.deviceTransferRequests.forEach(function (r) {
      if (r.scope !== 'all') { return; }
      if (Array.isArray(r.technologies) && r.technologies.length) { return; }
      var techs = packageTechnologiesForStudent(r.personId);
      if (!techs.length) { return; }
      r.technologies = techs;
      r.technology = techs.length === 1 ? techs[0] : null;
      changed = true;
    });
    if (changed) { save(); }
  }

  function migrateGovernance(parsed, storedVersion) {
    if (storedVersion >= 7) { return; }
    if (typeof parsed.protoTenantAdminId !== 'string') { parsed.protoTenantAdminId = null; }

    /* History entries written by an earlier build carry the actor's
       NAME but not their id, because nothing needed the id until role
       scope became withdrawable. Backfill it by matching the recorded
       name against the actor registry — names are unique there — so the
       governance surface can answer "what did this person decide?" for
       existing data too. An entry whose name matches nothing keeps a
       null id rather than being guessed at. */
    var byName = {};
    (parsed.contentActors || []).forEach(function (a) { byName[a.name] = a.id; });
    parsed.contentRecords.forEach(function (rec) {
      (rec.history || []).forEach(function (h) {
        if (h.actorId === undefined) { h.actorId = h.actorName ? (byName[h.actorName] || null) : null; }
      });
    });

    /* Tenants written before Implementation 06 are ACTIVE. */
    parsed.tenants.forEach(function (t) {
      if (t.status !== 'inactive') { t.status = 'active'; }
      if (!Array.isArray(t.history)) { t.history = []; }
    });

    /* Role assignments become governed rows. An existing row keeps its
       scope and simply gains the provenance and the reversible status. */
    parsed.contentRoleAssignments.forEach(function (m) {
      if (m.status !== 'removed') { m.status = 'active'; }
      if (typeof m.assignedBy !== 'string') { m.assignedBy = m.source === 'seed' ? 'Prototype seed' : 'Super Admin'; }
      if (m.assignedAt === undefined) { m.assignedAt = null; }
      if (m.removedBy === undefined) { m.removedBy = null; }
      if (m.removedAt === undefined) { m.removedAt = null; }
      if (typeof m.removedReason !== 'string') { m.removedReason = ''; }
    });

    /* A tenant carried over from an earlier build has no assigned Tenant
       Admin, because the concept did not exist. The seeded tenant gets
       the sample assignment so its workspace behaves exactly as before;
       a tenant created from an approved request is left WITHOUT one and
       surfaces as an attention row, which is the honest state rather
       than an invented person. */
    if (!parsed.tenantAdmins.length &&
        parsed.tenants.some(function (t) { return t.id === data.SEED_TENANT_ID; })) {
      parsed.seq.tenantAdmin += 1;
      parsed.tenantAdmins.push({
        id: 'TAD-' + util.pad3(parsed.seq.tenantAdmin),
        tenantId: data.SEED_TENANT_ID,
        name: 'Priya Raghavan',
        email: 'priya.raghavan@sample-institute.example',
        status: 'active', source: 'seed',
        assignedBy: 'Prototype seed',
        assignedAt: parsed.seededAt || null,
        removedBy: null, removedAt: null
      });
    }
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
    /* Implementation 07.3 — content-production corrections. */
    CHANGE_DESTINATION: CHANGE_DESTINATION,
    CONTENT_REF_KIND: CONTENT_REF_KIND,
    normalizeContentRefs: normalizeContentRefs,
    normalizePreviewVideo: normalizePreviewVideo,
    managerCanEditDelivery: managerCanEditDelivery,
    managerUpdateDelivery: managerUpdateDelivery,
    deliverySummaryFor: deliverySummaryFor,
    MANAGER_DELIVERY_FIELDS: MANAGER_DELIVERY_FIELDS,
    STATUS: STATUS, STATUS_META: STATUS_META, SOURCE_META: SOURCE_META,
    save: save, reset: reset, migratedFrom: migratedFrom,
    scenario: scenario, setScenario: setScenario,
    /* Implementation 07.2 — who the public plane is speaking for (A).
       Prototype-only, and it grants nothing. */
    scenarioTenant: scenarioTenant, requesterTenant: requesterTenant,
    selectionItems: selectionItems, selectionCount: selectionCount, selectionGet: selectionGet,
    selectionAdd: selectionAdd, selectionSetTech: selectionSetTech,
    selectionRemove: selectionRemove, selectionClear: selectionClear,
    draft: draft, draftSave: draftSave, draftClear: draftClear,
    requests: requests, request: request, requestsForScenario: requestsForScenario,
    submitRequest: submitRequest, approveRequest: approveRequest, completePayment: completePayment,
    requestMoreInformation: requestMoreInformation, resubmitRequest: resubmitRequest,
    requestDecisionBlock: requestDecisionBlock, requestCanBeDecided: requestCanBeDecided,
    resolveRequestTenant: resolveRequestTenant, validateGrant: validateGrant,
    technologiesUsedFor: technologiesUsedFor,
    technologyUseSummary: technologyUseSummary,
    roleAssignmentHistory: roleAssignmentHistory,
    actorWasEverSuspended: actorWasEverSuspended,
    tenantAwaitingActivation: tenantAwaitingActivation,
    grantNarrowsRequest: grantNarrowsRequest, PAYMENT_OUTCOME: PAYMENT_OUTCOME,
    tenants: tenants, tenantById: tenantById,
    accessForTenant: accessForTenant, accessAll: accessAll, accessById: accessById,
    accessTermState: accessTermState, accessIsLive: accessIsLive, liveAccessForTenant: liveAccessForTenant,
    accessAssignability: accessAssignability, accessIsAssignable: accessIsAssignable,
    assignableAccessForTenant: assignableAccessForTenant,
    unassignableAccessForTenant: unassignableAccessForTenant, assignabilityText: assignabilityText,
    accessTechnologies: accessTechnologies, accessHasExperiment: accessHasExperiment,
    /* Implementation 07.2 — what an institution already holds (A) */
    tenantAccessForExperiment: tenantAccessForExperiment,
    tenantHoldsExperiment: tenantHoldsExperiment,
    heldSelectionFor: heldSelectionFor,
    accessCourseIds: accessCourseIds, tenantCourseIds: tenantCourseIds,

    people: people, peopleForTenant: peopleForTenant, personById: personById,
    facultyForTenant: facultyForTenant, studentsForTenant: studentsForTenant,
    activeStudentsForTenant: activeStudentsForTenant,
    personByEmail: personByEmail, studentByStudentId: studentByStudentId,
    addFaculty: addFaculty, addStudent: addStudent, setStudentStatus: setStudentStatus,
    setStudentStatusAsPlatform: setStudentStatusAsPlatform,
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
    resultWithheld: resultWithheld, scoreWithheld: scoreWithheld,
    lastActivityAt: lastActivityAt, hasActivity: hasActivity,
    studentPastExperiments: studentPastExperiments,
    technologiesWithActivity: technologiesWithActivity,
    studentProgressSummary: studentProgressSummary,

    /* ---- Implementation 04 — Faculty ---- */
    QUESTION_TYPES: QUESTION_TYPES, REVIEW_MODE: REVIEW_MODE,

    protoFacultyId: protoFacultyId, setProtoFaculty: setProtoFaculty, protoFaculty: protoFaculty,
    facultyPref: facultyPref, setFacultyReviewMode: setFacultyReviewMode,

    facultyScope: facultyScope, facultyExperimentIds: facultyExperimentIds,
    facultyTenantHoldings: facultyTenantHoldings,
    pendingReviewsWithoutEvaluator: pendingReviewsWithoutEvaluator,
    pendingReviewsLosingEvaluator: pendingReviewsLosingEvaluator,
    facultyCanManage: facultyCanManage, facultyScopeRow: facultyScopeRow,
    facultyStudentReach: facultyStudentReach, facultyStudentIds: facultyStudentIds,

    questionById: questionById, activeQuestion: activeQuestion,
    questionsForTenant: questionsForTenant, questionsForFaculty: questionsForFaculty,
    validateQuestion: validateQuestion, addQuestion: addQuestion,
    updateQuestion: updateQuestion, deleteQuestion: deleteQuestion,
    questionUsage: questionUsage,

    assessmentDefById: assessmentDefById, assessmentForTenant: assessmentForTenant,
    assessmentForStudent: assessmentForStudent, assessmentDefsForTenant: assessmentDefsForTenant,
    attemptAssessment: attemptAssessment, snapshotOfDefinition: snapshotOfDefinition,
    releaseFor: releaseFor, assessmentTotals: assessmentTotals,
    assessmentReadiness: assessmentReadiness,
    assessmentAttemptStats: assessmentAttemptStats,
    validateAssessmentSettings: validateAssessmentSettings,
    createAssessment: createAssessment, updateAssessmentSettings: updateAssessmentSettings,
    addQuestionsToAssessment: addQuestionsToAssessment,
    removeQuestionFromAssessment: removeQuestionFromAssessment,
    moveAssessmentQuestion: moveAssessmentQuestion,
    assessmentQuestionLink: assessmentQuestionLink,
    refreshAssessmentQuestion: refreshAssessmentQuestion,

    reviewById: reviewById, reviewsForAttempt: reviewsForAttempt,
    attemptReviewState: attemptReviewState, reviewsForFaculty: reviewsForFaculty,
    facultyCanReview: facultyCanReview, reviewQuestion: reviewQuestion, reviewAnswer: reviewAnswer,
    generateReviewAssistance: generateReviewAssistance, finaliseReview: finaliseReview,

    facultyExperimentStats: facultyExperimentStats, facultyOverview: facultyOverview,

    /* ---- Implementation 05 — content production ---- */
    CONTENT_STATUS: CONTENT_STATUS, CONTENT_STATUS_META: CONTENT_STATUS_META,
    CONTENT_ROLE: CONTENT_ROLE, CONTENT_ROLE_LABEL: CONTENT_ROLE_LABEL,
    contentStatusMeta: contentStatusMeta,

    publishedPool: publishedPool,

    contentActors: contentActors, contentActor: contentActor, contentRoleLabel: contentRoleLabel,
    assignmentsFor: assignmentsFor, allAssignmentsFor: allAssignmentsFor,
    actorCourseIds: actorCourseIds, actorCreateCourseIds: actorCreateCourseIds,
    actorScopeText: actorScopeText,
    actorHasPlatformScope: actorHasPlatformScope, actorCoversRecord: actorCoversRecord,

    protoVendorId: protoVendorId, setProtoVendor: setProtoVendor, protoVendor: protoVendor,
    protoReviewerId: protoReviewerId, setProtoReviewer: setProtoReviewer, protoReviewer: protoReviewer,
    protoManagerId: protoManagerId, setProtoManager: setProtoManager, protoManager: protoManager,

    contentRecords: contentRecords, contentRecord: contentRecord, contentContext: contentContext,
    contentForVendor: contentForVendor, contentForReviewer: contentForReviewer,
    contentForManager: contentForManager,
    academicReviewsFor: academicReviewsFor, academicReviewsBy: academicReviewsBy,
    publicationRecords: publicationRecords, publicationFor: publicationFor,

    validateContent: validateContent, isHttpUrl: isHttpUrl, deliveryOf: deliveryOf,
    academicFingerprint: academicFingerprint, canonicalEditable: canonicalEditable,
    managerCanFileInto: managerCanFileInto,
    academicReadiness: academicReadiness, publishReadiness: publishReadiness,

    vendorCanEdit: vendorCanEdit, vendorCanSubmit: vendorCanSubmit, vendorCanCreateIn: vendorCanCreateIn,
    /* The view / mutate split, exported so a screen can render the
       right refusal instead of guessing which rule stopped it. */
    canViewHistoricalRecord: canViewHistoricalRecord,
    canMutateVendorRecord: canMutateVendorRecord,
    vendorScopeWithdrawn: vendorScopeWithdrawn,
    createContentDraft: createContentDraft, updateContentDraft: updateContentDraft,
    submitContent: submitContent,

    reviewerCanAct: reviewerCanAct, outcomesEditable: outcomesEditable,
    addOutcome: addOutcome, updateOutcome: updateOutcome,
    deleteOutcome: deleteOutcome, moveOutcome: moveOutcome,
    approveAcademic: approveAcademic, requestChangesAcademic: requestChangesAcademic,

    managerCanAct: managerCanAct, managerCanPublish: managerCanPublish,
    updateCanonicalMetadata: updateCanonicalMetadata,
    requestChangesContent: requestChangesContent, publishContent: publishContent,

    vendorOverview: vendorOverview, reviewerOverview: reviewerOverview, managerOverview: managerOverview,

    /* ---- Implementation 06 — Super Admin governance + B2B operations ---- */

    /* tenant governance */
    tenantIsActive: tenantIsActive, tenantStatusMeta: tenantStatusMeta,
    deactivateTenant: deactivateTenant, reactivateTenant: reactivateTenant,
    tenantWriteBlock: tenantWriteBlock, tenantCanWrite: tenantCanWrite,
    personCanWrite: personCanWrite, TENANT_INACTIVE_TEXT: TENANT_INACTIVE_TEXT,

    /* Tenant Admin assignment */
    tenantAdmins: tenantAdmins, tenantAdminById: tenantAdminById,
    tenantAdminsFor: tenantAdminsFor, allTenantAdminsFor: allTenantAdminsFor,
    tenantsWithoutAdmin: tenantsWithoutAdmin,
    validateTenantAdmin: validateTenantAdmin,
    assignTenantAdmin: assignTenantAdmin, removeTenantAdmin: removeTenantAdmin,
    protoTenantAdminId: protoTenantAdminId, setProtoTenantAdmin: setProtoTenantAdmin,
    protoTenantAdmin: protoTenantAdmin, actingTenantAdmin: actingTenantAdmin,

    /* platform role governance */
    ROLE_SCOPE: ROLE_SCOPE, ROLE_SCOPE_LABEL: ROLE_SCOPE_LABEL,
    roleScopesAllowed: roleScopesAllowed, roleScopeLabel: roleScopeLabel,
    /* Implementation 07.1 — platform actor registration. */
    registerContentActor: registerContentActor, validateContentActor: validateContentActor,
    CONTENT_ROLE_ORDER: CONTENT_ROLE_ORDER,
    /* Implementation 07.1 — canonical academic structure (D3: create + rename). */
    groupingRecords: groupingRecords, courseRecords: courseRecords,
    groupingRecord: groupingRecord, courseRecord: courseRecord,
    coursesInGroupingRecord: coursesInGroupingRecord,
    createGrouping: createGrouping, updateGrouping: updateGrouping,
    createCourse: createCourse, updateCourse: updateCourse,
    validateGroupingFields: validateGroupingFields, validateCourseFields: validateCourseFields,
    courseUsage: courseUsage, courseMoveBlock: courseMoveBlock, structureSource: structureSource,
    roleAssignments: roleAssignments, roleAssignmentById: roleAssignmentById,
    actorsForCourse: actorsForCourse, actorsForRecord: actorsForRecord,
    validateRoleAssignment: validateRoleAssignment,
    assignPlatformRole: assignPlatformRole,
    removePlatformRoleAssignment: removePlatformRoleAssignment,
    restorePlatformRoleAssignment: restorePlatformRoleAssignment,
    actorHistoricalRecordIds: actorHistoricalRecordIds,

    /* canonical / master metadata, platform side */
    updateCanonicalAsPlatform: updateCanonicalAsPlatform, canonicalTree: canonicalTree,

    /* Implementation 07.2 — platform override on the content chain (F) */
    OVERRIDABLE_STATUS: OVERRIDABLE_STATUS,
    overrideDestinations: overrideDestinations,
    overrideContentStatusAsPlatform: overrideContentStatusAsPlatform,
    withdrawAllScopesForActor: withdrawAllScopesForActor,

    /* Implementation 07.2 — the canonical Course code (E) */
    validateCourseCode: validateCourseCode,
    managerCanSetCourseCode: managerCanSetCourseCode,
    coursesForManager: coursesForManager,
    updateCourseCode: updateCourseCode,

    /* later version — Release / Hold */
    VERSION_STATUS: VERSION_STATUS, VERSION_STATUS_META: VERSION_STATUS_META,
    versionStatusMeta: versionStatusMeta,
    contentVersions: contentVersions, contentVersion: contentVersion,
    versionsForRecord: versionsForRecord, openVersionForRecord: openVersionForRecord,
    releasedVersionsForRecord: releasedVersionsForRecord,
    currentVersionLabel: currentVersionLabel,
    versionsAwaitingDecision: versionsAwaitingDecision, versionsOnHold: versionsOnHold,
    versionsForReviewer: versionsForReviewer, versionsForVendor: versionsForVendor,
    validateVersion: validateVersion, vendorCanVersion: vendorCanVersion,
    canViewHistoricalVersion: canViewHistoricalVersion,
    canMutateVendorVersion: canMutateVendorVersion,
    versionScopeWithdrawn: versionScopeWithdrawn,
    createContentVersion: createContentVersion, updateContentVersion: updateContentVersion,
    versionEditableByVendor: versionEditableByVendor,
    versionSubmittableByVendor: versionSubmittableByVendor,
    submitContentVersion: submitContentVersion,
    reviewerCanActOnVersion: reviewerCanActOnVersion,
    reviewerCanViewVersion: reviewerCanViewVersion,
    approveVersionAcademic: approveVersionAcademic,
    requestChangesVersionAcademic: requestChangesVersionAcademic,
    versionAwaitingDecision: versionAwaitingDecision,
    releaseVersion: releaseVersion, holdVersion: holdVersion,
    returnHeldVersionToDecision: returnHeldVersionToDecision,

    /* device replacement / transfer */
    TRANSFER_STATUS: TRANSFER_STATUS, TRANSFER_OPEN: TRANSFER_OPEN,
    transferStatusMeta: transferStatusMeta, transferIsOpen: transferIsOpen,
    /* Implementation 07.2 — the Institute / Tenant Admin hop (C) */
    transfersAwaitingTenant: transfersAwaitingTenant,
    transfersForTenant: transfersForTenant,
    escalateDeviceTransfer: escalateDeviceTransfer,
    deviceTransferRequests: deviceTransferRequests, deviceTransferById: deviceTransferById,
    transfersForStudent: transfersForStudent, openTransferForStudent: openTransferForStudent,
    transfersAwaitingDecision: transfersAwaitingDecision,
    isPackageTechnology: isPackageTechnology,
    packageTechnologiesForStudent: packageTechnologiesForStudent,
    studentHasPackageTechnology: studentHasPackageTechnology,
    studentCanRequestTransfer: studentCanRequestTransfer,
    validateTransfer: validateTransfer,
    createDeviceTransfer: createDeviceTransfer, decideDeviceTransfer: decideDeviceTransfer,
    transferTechnologies: transferTechnologies, transferCoversAll: transferCoversAll,

    /* support / help */
    SUPPORT_STATUS: SUPPORT_STATUS, SUPPORT_CATEGORIES: SUPPORT_CATEGORIES,
    supportStatusMeta: supportStatusMeta, supportCategoryLabel: supportCategoryLabel,
    supportTickets: supportTickets, supportTicketById: supportTicketById,
    ticketsForRequester: ticketsForRequester, openSupportTickets: openSupportTickets,
    ticketsForTenant: ticketsForTenant,
    validateSupportTicket: validateSupportTicket,
    createSupportTicket: createSupportTicket,
    resolveSupportTicket: resolveSupportTicket, reopenSupportTicket: reopenSupportTicket,

    /* Implementation 07.2 — renewal follows the institution's own
       onboarding route (D). There is no direct-extension writer. */
    renewalRouteFor: renewalRouteFor, renewalRouteForAccess: renewalRouteForAccess,
    originRequestFor: originRequestFor,
    submitRenewalRequest: submitRenewalRequest,
    renewalRequestsForAccess: renewalRequestsForAccess,
    openRenewalForAccess: openRenewalForAccess,
    renewalRequestsForTenant: renewalRequestsForTenant,
    renewalBlock: renewalBlock, renewalBlockText: renewalBlockText,
    canRenewAccess: canRenewAccess,

    /* access term + the 15-day reminder */
    EXPIRY_REMINDER_DAYS: EXPIRY_REMINDER_DAYS,
    accessDaysUntilExpiry: accessDaysUntilExpiry,
    protoSetAccessEnd: protoSetAccessEnd, expiryReminderDue: expiryReminderDue,
    accessNeedingExpiryReminder: accessNeedingExpiryReminder,
    tenantAccessNeedingExpiryReminder: tenantAccessNeedingExpiryReminder,
    expiredAccessForTenant: expiredAccessForTenant,

    /* platform read models */
    platformOverview: platformOverview, tenantReport: tenantReport
  };
})();

/* ------------------------------------------------------------------
   Install the canonical published pool into the catalogue lookups.

   From here on, `data.experiment()`, `data.experimentsInCourse()`,
   `data.experimentsInGrouping()`, `data.contextOf()`,
   `data.technologiesInUse()` and `data.experiments()` all resolve
   against `contentRecords[]` filtered to PUBLISHED. That is what makes
   ONE content source real: the public catalogue, tenant content
   access, Faculty My Content and Student My Learning read the same
   pool the Content Manager publishes into, and nothing unpublished is
   reachable through any of them.
   ------------------------------------------------------------------ */
XRSLP.data.setPublishedResolver(XRSLP.state.publishedPool);

/* ------------------------------------------------------------------
   Install the canonical ACADEMIC STRUCTURE into the catalogue lookups
   (Implementation 07.1).

   From here on `data.grouping()`, `data.course()`,
   `data.coursesInGrouping()`, `data.experimentsInGrouping()`,
   `data.contextOf()`, `data.groupingByName()`, `data.courseByName()`,
   `data.groupings()` and `data.courses()` all resolve against
   `groupings[]` / `courses[]` in state. That is what makes a Programme
   or Course created by the Super Admin reach the public catalogue, the
   Vendor's Course chooser, role governance, the Content Manager's
   canonical-metadata form and the tenant's CSV course mapping without a
   single call-site change — the same mechanism that already makes ONE
   content pool real one level below.
   ------------------------------------------------------------------ */
XRSLP.data.setStructureResolver(XRSLP.state.structureSource);
