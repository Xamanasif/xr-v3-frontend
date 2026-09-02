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
  var SCHEMA_VERSION = 6;

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
      contentRoleAssignments: []
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
             contentRec: 0, contentEvent: 0, actor: 0, roleAssign: 0, publication: 0 }
    };
    /* `contentSeeding` keeps the data.js published-pool resolver on the
       SEED array while this function builds a NEW state object: the
       resolver would otherwise read the OUTGOING state during a reset. */
    contentSeeding = true;
    try {
      seedContent(S0);
      seedTenantOperations(S0);
      seedFacultyAuthoring(S0);
    } finally {
      contentSeeding = false;
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
     'contentRec', 'contentEvent', 'actor', 'roleAssign', 'publication']
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
    if (typeof parsed.protoFacultyId !== 'string') { parsed.protoFacultyId = null; }
    else if (!parsed.people.some(function (p) { return p.id === parsed.protoFacultyId && p.role === 'faculty'; })) {
      parsed.protoFacultyId = null;
    }
    if (!parsed.facultyPrefs || typeof parsed.facultyPrefs !== 'object') { parsed.facultyPrefs = {}; }

    migrateFacultyAuthoring(parsed, stored);
    migrateContentProduction(parsed, stored);

    parsed.schemaVersion = SCHEMA_VERSION;
    delete parsed.version;
    parsed.migratedFrom = stored < SCHEMA_VERSION ? stored : (parsed.migratedFrom || null);
    return parsed;
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
        source: 'seed'
      });
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

  function publicShape(rec) {
    return {
      id: rec.id, courseId: rec.courseId, name: rec.name,
      summary: rec.summary, description: rec.description,
      outcomes: rec.outcomes.slice(), technologies: rec.technologies.slice()
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

  function assignmentsFor(actorId) {
    return S.contentRoleAssignments.filter(function (m) { return m.actorId === actorId; });
  }
  /* Which canonical Courses an actor is authorised on. A platform-scope
     assignment ('all') covers every canonical Course. */
  function actorCourseIds(actorId) {
    var rows = assignmentsFor(actorId);
    if (rows.some(function (m) { return m.scope === 'all'; })) {
      return data.COURSES.map(function (c) { return c.id; });
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
      if (o.queue && r.status !== CONTENT_STATUS.ACADEMIC_REVIEW) { return false; }
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
    if (rec.status !== CONTENT_STATUS.ACADEMIC_REVIEW) {
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

  function pushContentEvent(rec, kind, label, actor, at, note) {
    var seq = contentTouched();
    rec.history.unshift({
      seq: seq, kind: kind, label: label,
      actorName: actor ? actor.name : null,
      actorRole: actor ? CONTENT_ROLE_LABEL[actor.role] : null,
      at: at || new Date().toISOString(),
      note: note || ''
    });
    rec.eventSeq = seq;
    return seq;
  }

  /* ---------- Vendor actions ----------
     Every one refuses on authority before it writes. A hand-typed route
     reaches the same function, so the refusal is the state layer's, not
     the screen's. */

  function vendorCanEdit(rec, actorId) {
    if (!rec) { return false; }
    if (rec.createdBy !== actorId) { return false; }
    return VENDOR_EDITABLE.indexOf(rec.status) !== -1;
  }
  function vendorCanSubmit(rec, actorId) { return vendorCanEdit(rec, actorId); }

  function vendorCanCreateIn(actorId, courseId) {
    return actorCourseIds(actorId).indexOf(courseId) !== -1;
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
    if (!vendorCanEdit(rec, actorId)) { return null; }
    if (!vendorCanCreateIn(actorId, fields.courseId)) { return null; }
    if (validateContent(fields, 'draft', { exceptId: rec.id }).length) { return null; }
    rec.courseId = fields.courseId;
    rec.name = String(fields.name).trim();
    rec.summary = fields.summary || '';
    rec.description = fields.description || '';
    rec.technologies = data.sortTech(fields.technologies || []);
    rec.delivery = fields.delivery || {};
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
    if (!vendorCanSubmit(rec, actorId)) { return null; }
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
    return rec.status === CONTENT_STATUS.ACADEMIC_REVIEW;
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
  function requestChangesAcademic(actorId, recordId, comment) {
    var rec = contentRecord(recordId);
    var actor = contentActor(actorId);
    if (!reviewerCanAct(rec, actorId)) { return null; }
    var text = String(comment || '').trim();
    if (!text) { return null; }
    var now = new Date().toISOString();
    S.seq.review += 1;
    var review = {
      id: 'ACR-' + util.pad3(S.seq.review), recordId: rec.id,
      reviewerId: actorId, reviewerName: actor.name,
      decision: 'changes_requested', comment: text,
      revision: rec.revision, outcomes: rec.outcomes.slice(), at: now
    };
    S.academicReviews.push(review);
    rec.status = CONTENT_STATUS.CHANGES_ACADEMIC;
    rec.returnedGate = 'academic';
    rec.resubmitted = false;
    rec.updatedAt = now;
    pushContentEvent(rec, 'changes', 'Changes requested — academic review', actor, now, text);
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

  function updateCanonicalMetadata(actorId, recordId, fields) {
    var rec = contentRecord(recordId);
    var actor = contentActor(actorId);
    if (!managerCanAct(rec, actorId)) { return null; }
    if (!canonicalEditable(rec)) { return null; }
    var name = String(fields.name || '').trim();
    if (!name || nameTaken(name, rec.id)) { return null; }
    if (!data.course(fields.courseId)) { return null; }
    rec.name = name;
    rec.courseId = fields.courseId;
    rec.summary = String(fields.summary || '').trim();
    rec.description = String(fields.description || '').trim();
    rec.updatedAt = new Date().toISOString();
    pushContentEvent(rec, 'metadata', 'Canonical metadata updated', actor, rec.updatedAt, '');
    save();
    return rec;
  }

  /* PM-14's return path, at the content readiness gate. */
  function requestChangesContent(actorId, recordId, comment) {
    var rec = contentRecord(recordId);
    var actor = contentActor(actorId);
    if (!managerCanAct(rec, actorId)) { return null; }
    if (rec.status !== CONTENT_STATUS.CONTENT_REVIEW) { return null; }
    var text = String(comment || '').trim();
    if (!text) { return null; }
    var now = new Date().toISOString();
    rec.status = CONTENT_STATUS.CHANGES_CONTENT;
    rec.returnedGate = 'content';
    rec.resubmitted = false;
    rec.updatedAt = now;
    pushContentEvent(rec, 'changes', 'Changes requested — content readiness', actor, now, text);
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
      waiting: n(CONTENT_STATUS.ACADEMIC_REVIEW),
      queue: scope.filter(function (r) { return r.status === CONTENT_STATUS.ACADEMIC_REVIEW; }),
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
    assignmentsFor: assignmentsFor, actorCourseIds: actorCourseIds,
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
    academicReadiness: academicReadiness, publishReadiness: publishReadiness,

    vendorCanEdit: vendorCanEdit, vendorCanSubmit: vendorCanSubmit, vendorCanCreateIn: vendorCanCreateIn,
    createContentDraft: createContentDraft, updateContentDraft: updateContentDraft,
    submitContent: submitContent,

    reviewerCanAct: reviewerCanAct, outcomesEditable: outcomesEditable,
    addOutcome: addOutcome, updateOutcome: updateOutcome,
    deleteOutcome: deleteOutcome, moveOutcome: moveOutcome,
    approveAcademic: approveAcademic, requestChangesAcademic: requestChangesAcademic,

    managerCanAct: managerCanAct, managerCanPublish: managerCanPublish,
    updateCanonicalMetadata: updateCanonicalMetadata,
    requestChangesContent: requestChangesContent, publishContent: publishContent,

    vendorOverview: vendorOverview, reviewerOverview: reviewerOverview, managerOverview: managerOverview
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
