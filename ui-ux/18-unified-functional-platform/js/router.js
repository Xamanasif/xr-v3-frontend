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
     learn    → Student workspace shell */
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
    { pattern: ['tenant', ':tenantId', 'faculty-mapping'],    area: 'tenant', screen: 'tenantFacultyMapping' },
    /* Faculty workspace (Implementation 04). Faculty is a formal role
       inside a Tenant (STK31-01 / 04); everything it reaches is bounded
       by that Faculty member's Implementation-02 mappings. `#/faculty`
       resolves the prototype's currently-selected REAL faculty record,
       or offers the prototype-only chooser.

       Every destination below is implemented. There is no Messages,
       Attendance, Certificates, Calendar, Profile or Support entry:
       none of them is built, and a link that leads nowhere is worse
       than an absent one. */
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
    /* Student workspace (Implementation 03). Student and Learner are
       ONE formal role (STK31-01); `learn` is that role's workspace.
       `#/learn` resolves the prototype's currently-selected REAL
       student record, or offers the prototype-only chooser. */
    { pattern: ['learn'],                                     area: 'learn', screen: 'learnHome' },
    { pattern: ['learn', ':studentId', 'home'],               area: 'learn', screen: 'studentHome' },
    { pattern: ['learn', ':studentId', 'my-learning'],        area: 'learn', screen: 'studentMyLearning' },
    { pattern: ['learn', ':studentId', 'progress'],           area: 'learn', screen: 'studentProgress' },
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
      area: 'learn', screen: 'studentResult' }
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
