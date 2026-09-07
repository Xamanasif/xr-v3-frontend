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
     tenant   → Tenant workspace shell
     faculty  → Faculty workspace shell
     learn    → Student workspace shell
     vendor   → Vendor workspace shell            (Implementation 05)
     review   → Academic Reviewer workspace shell (Implementation 05)
     content  → Content Manager workspace shell   (Implementation 05) */
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
    /* SUPER ADMIN workspace. Six destinations, every one implemented.
       Implementation 06 added Overview, the institution governance
       detail, content governance (canonical catalogue + later-version
       Release / Hold), role governance and operations (device
       transfers · support · access-term expiry).

       There is no publish route anywhere on this plane: the FIRST
       publication of a new Experiment is the Content Manager's
       (STK31-06). Release / Hold acts on a later version only. */
    { pattern: ['platform'],                        redirect: '#/platform/overview' },
    { pattern: ['platform', 'overview'],            area: 'platform', screen: 'platformOverview' },
    { pattern: ['platform', 'requests'],            area: 'platform', screen: 'platformRequests' },
    { pattern: ['platform', 'requests', ':id'],     area: 'platform', screen: 'platformRequestDetail' },
    { pattern: ['platform', 'institutions'],        area: 'platform', screen: 'platformInstitutions' },
    { pattern: ['platform', 'institutions', ':id'], area: 'platform', screen: 'platformInstitution' },
    { pattern: ['platform', 'content'],             area: 'platform', screen: 'platformContent' },
    { pattern: ['platform', 'content', ':recordId'], area: 'platform', screen: 'platformRecord' },
    /* Implementation 07.1 — Programme / department and Course master
       records. Platform-controlled structure; create and rename only. */
    { pattern: ['platform', 'structure'],           area: 'platform', screen: 'platformStructure' },
    { pattern: ['platform', 'structure', 'programme', ':groupingId'], area: 'platform', screen: 'platformGrouping' },
    { pattern: ['platform', 'structure', 'course', ':courseId'],      area: 'platform', screen: 'platformCourse' },
    { pattern: ['platform', 'roles'],               area: 'platform', screen: 'platformRoles' },
    { pattern: ['platform', 'roles', ':actorId'],   area: 'platform', screen: 'platformActor' },
    { pattern: ['platform', 'operations'],          area: 'platform', screen: 'platformOperations' },
    { pattern: ['platform', 'transfer', ':id'],     area: 'platform', screen: 'platformTransfer' },
    { pattern: ['platform', 'support', ':id'],      area: 'platform', screen: 'platformTicket' },
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
    { pattern: ['tenant', ':tenantId', 'faculty-mapping'],    area: 'tenant', screen: 'tenantFacultyMapping' },
    /* Implementation 07.2 — the Institute / Tenant Admin is the
       institution's POC for device replacement / transfer. A Student's
       request arrives HERE first and is forwarded to the Super Admin
       from here; the Super Admin remains the final decision maker. */
    { pattern: ['tenant', ':tenantId', 'device-requests'],    area: 'tenant', screen: 'tenantDeviceRequests' },
    { pattern: ['tenant', ':tenantId', 'device-request', ':id'], area: 'tenant', screen: 'tenantDeviceRequest' },
    /* Help — one consistent destination in every workspace
       (WCAG 2.2 SC 3.2.6 is Level A, and STK31-39 gives Help a real
       destination to point at for the first time). */
    { pattern: ['tenant', ':tenantId', 'help'],               area: 'tenant', screen: 'tenantHelp' },
    /* Faculty workspace (Implementation 04). Faculty is a formal role
       inside a Tenant (STK31-01 / 04); everything it reaches is bounded
       by that Faculty member's Implementation-02 mappings. `#/faculty`
       resolves the prototype's currently-selected REAL faculty record,
       or offers the prototype-only chooser.

       Every destination below is implemented. There is no Messages,
       Attendance, Certificates, Calendar or Profile entry: none of them
       is built, and a link that leads nowhere is worse than an absent
       one. Help IS present from Implementation 06 — it now has a real
       destination behind it (STK31-39). */
    { pattern: ['faculty'],                                     area: 'faculty', screen: 'facultyHome' },
    { pattern: ['faculty', ':facultyId', 'overview'],           area: 'faculty', screen: 'facultyOverview' },
    { pattern: ['faculty', ':facultyId', 'content'],            area: 'faculty', screen: 'facultyContent' },
    { pattern: ['faculty', ':facultyId', 'assessments'],        area: 'faculty', screen: 'facultyAssessments' },
    { pattern: ['faculty', ':facultyId', 'assessment', ':experimentId'],
      area: 'faculty', screen: 'facultyAssessment' },
    { pattern: ['faculty', ':facultyId', 'assessment', ':experimentId', 'settings'],
      area: 'faculty', screen: 'facultyAssessmentSettings' },
    { pattern: ['faculty', ':facultyId', 'assessment', ':experimentId', 'questions'],
      area: 'faculty', screen: 'facultyAssessmentQuestions' },
    { pattern: ['faculty', ':facultyId', 'assessment', ':experimentId', 'preview'],
      area: 'faculty', screen: 'facultyAssessmentPreview' },
    { pattern: ['faculty', ':facultyId', 'questions'],          area: 'faculty', screen: 'facultyQuestionBank' },
    { pattern: ['faculty', ':facultyId', 'questions', 'new'],   area: 'faculty', screen: 'facultyQuestionNew' },
    { pattern: ['faculty', ':facultyId', 'questions', 'draft'], area: 'faculty', screen: 'facultyQuestionDraft' },
    { pattern: ['faculty', ':facultyId', 'question', ':questionId'],
      area: 'faculty', screen: 'facultyQuestionEdit' },
    { pattern: ['faculty', ':facultyId', 'reviews'],            area: 'faculty', screen: 'facultyReviews' },
    { pattern: ['faculty', ':facultyId', 'review', ':reviewId'], area: 'faculty', screen: 'facultyReview' },
    { pattern: ['faculty', ':facultyId', 'students'],           area: 'faculty', screen: 'facultyStudents' },
    { pattern: ['faculty', ':facultyId', 'student', ':studentId', ':experimentId'],
      area: 'faculty', screen: 'facultyStudentDetail' },
    { pattern: ['faculty', ':facultyId', 'help'],               area: 'faculty', screen: 'facultyHelp' },
    /* Student workspace (Implementation 03). Student and Learner are
       ONE formal role (STK31-01); `learn` is that role's workspace.
       `#/learn` resolves the prototype's currently-selected REAL
       student record, or offers the prototype-only chooser. */
    { pattern: ['learn'],                                     area: 'learn', screen: 'learnHome' },
    { pattern: ['learn', ':studentId', 'home'],               area: 'learn', screen: 'studentHome' },
    { pattern: ['learn', ':studentId', 'my-learning'],        area: 'learn', screen: 'studentMyLearning' },
    { pattern: ['learn', ':studentId', 'progress'],           area: 'learn', screen: 'studentProgress' },
    /* Device replacement / transfer (STK31-38) and Help (STK31-39). */
    { pattern: ['learn', ':studentId', 'device'],             area: 'learn', screen: 'studentDevice' },
    { pattern: ['learn', ':studentId', 'help'],               area: 'learn', screen: 'studentHelp' },
    { pattern: ['learn', ':studentId', 'experiment', ':experimentId'],
      area: 'learn', screen: 'studentExperiment' },
    { pattern: ['learn', ':studentId', 'experiment', ':experimentId', 'simulation', ':tech'],
      area: 'learn', screen: 'studentSimulation' },
    /* The assessment belongs to the EXPERIMENT, so its routes carry no
       technology segment. Only the simulation is technology-specific.
       See the note at the head of state.js for the source evidence. */
    { pattern: ['learn', ':studentId', 'experiment', ':experimentId', 'assessment'],
      area: 'learn', screen: 'studentAssessment' },
    { pattern: ['learn', ':studentId', 'experiment', ':experimentId', 'assessment', 'attempt'],
      area: 'learn', screen: 'studentAttempt' },
    { pattern: ['learn', ':studentId', 'experiment', ':experimentId', 'assessment', 'result'],
      area: 'learn', screen: 'studentResult' },

    /* ---- Implementation 05 — content production ----
       Three central workspaces, one content source. Every destination
       below is implemented, and every one resolves its actor: a route
       carrying an id that is not a REAL actor of that role, or a record
       outside that actor's authority, resolves to notFound rather than
       rendering something the role may not have. */

    /* VENDOR — technical submission. Never publishes (FRD 1.4.5). */
    { pattern: ['vendor'],                                     area: 'vendor', screen: 'vendorHome' },
    { pattern: ['vendor', ':actorId', 'overview'],             area: 'vendor', screen: 'vendorOverview' },
    { pattern: ['vendor', ':actorId', 'experiments'],          area: 'vendor', screen: 'vendorExperiments' },
    { pattern: ['vendor', ':actorId', 'experiments', 'new'],   area: 'vendor', screen: 'vendorNew' },
    { pattern: ['vendor', ':actorId', 'submissions'],          area: 'vendor', screen: 'vendorSubmissions' },
    { pattern: ['vendor', ':actorId', 'experiment', ':recordId'],
      area: 'vendor', screen: 'vendorRecord' },
    { pattern: ['vendor', ':actorId', 'experiment', ':recordId', 'edit'],
      area: 'vendor', screen: 'vendorEdit' },
    /* LATER VERSIONS of already-published content (STK31-07). The
       Vendor proposes; the Academic Reviewer approves; the SUPER ADMIN
       releases or holds. The word `publish` appears on none of them. */
    { pattern: ['vendor', ':actorId', 'experiment', ':recordId', 'version'],
      area: 'vendor', screen: 'vendorNewVersion' },
    { pattern: ['vendor', ':actorId', 'versions'],             area: 'vendor', screen: 'vendorVersions' },
    { pattern: ['vendor', ':actorId', 'version', ':versionId'], area: 'vendor', screen: 'vendorVersion' },
    { pattern: ['vendor', ':actorId', 'help'],                 area: 'vendor', screen: 'vendorHelp' },

    /* ACADEMIC REVIEWER — academic validation + Learning Outcomes.
       There is no publish route on this plane. */
    { pattern: ['review'],                                     area: 'review', screen: 'reviewerHome' },
    { pattern: ['review', ':actorId', 'overview'],             area: 'review', screen: 'reviewerOverview' },
    { pattern: ['review', ':actorId', 'queue'],                area: 'review', screen: 'reviewerQueue' },
    { pattern: ['review', ':actorId', 'submission', ':recordId'],
      area: 'review', screen: 'reviewerRecord' },
    { pattern: ['review', ':actorId', 'version', ':versionId'],
      area: 'review', screen: 'reviewerVersion' },
    { pattern: ['review', ':actorId', 'help'],                  area: 'review', screen: 'reviewerHelp' },

    /* CONTENT MANAGER — Content Library + FIRST PUBLICATION. The word
       here is Publish; Release / Hold is the Super Admin's action on a
       later version and has no route anywhere in this build. */
    { pattern: ['content'],                                    area: 'content', screen: 'managerHome' },
    { pattern: ['content', ':actorId', 'overview'],            area: 'content', screen: 'managerOverview' },
    { pattern: ['content', ':actorId', 'library'],             area: 'content', screen: 'managerLibrary' },
    { pattern: ['content', ':actorId', 'queue'],               area: 'content', screen: 'managerQueue' },
    { pattern: ['content', ':actorId', 'item', ':recordId'],   area: 'content', screen: 'managerRecord' },
    { pattern: ['content', ':actorId', 'item', ':recordId', 'metadata'],
      area: 'content', screen: 'managerMetadata' },
    /* Implementation 07.2 — the canonical Course code is primarily the
       Content Manager's, and the Super Admin also has access to it
       through the Academic structure screen. This route is the Content
       Manager's half; it edits ONE field and cannot create, rename,
       re-parent or delete a Course. */
    { pattern: ['content', ':actorId', 'courses'],             area: 'content', screen: 'managerCourses' },
    { pattern: ['content', ':actorId', 'help'],                area: 'content', screen: 'managerHelp' }
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
