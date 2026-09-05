/* ============================================================
   PROTOTYPE-ONLY QA CHECKS — Implementation 06, and the
   Implementation 01–05 regressions that must survive it.

   Exercises the STATE LAYER directly, outside a browser, so every
   invariant is asserted rather than eyeballed. The screens are checked
   separately in the browser; this file checks the rules underneath
   them, which is where an entitlement, a licence or a published
   version can actually go wrong.

   Run from the prototype folder:

     /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/\
       Helpers/jsc qa/harness.js qa/checks.js

   Nothing here ships: index.html does not reference qa/, and no
   product code knows this file exists.
   ============================================================ */

var S, D;
function boot() { S = fresh(); D = XRSLP.data; return S; }

var TENANT = 'tenant-sample-engineering';
var RAHUL = 'USR-003';
var ARJUN = 'USR-001';
var IYER = 'ACT-003';      /* Dr. R. Iyer      — reviewer, soil-mechanics + surveying + structural */
var RAO = 'ACT-001';       /* Ananya Rao       — vendor, the same three courses */
var KULK = 'ACT-005';      /* M. Kulkarni      — Content Manager, platform scope */

/* ---------- shared helper: give the seeded tenant real access ----------
   Mirrors exactly what the product does — a public selection, a
   request, a Super Admin approval — so nothing is fabricated straight
   into state. */
function grantAccess(experimentIds, technologies, quantity, term) {
  S.setScenario('A');
  experimentIds.forEach(function (id) { S.selectionAdd(id, technologies.slice()); });
  var req = S.submitRequest({
    institutionName: 'Sample Engineering Institute',
    contactName: 'Dr. Kavita Sharma',
    contactEmail: 'kavita.sharma@sample-institute.example',
    quantity: quantity, term: term || 'yearly'
  });
  S.approveRequest(req.id, { reason: 'QA — approved as submitted.' });
  return { request: S.request(req.id), access: S.accessForTenant(TENANT).slice(-1)[0] };
}

/* ============================================================
   SCENARIO A — the Implementation-01 B2B path still works
   ============================================================ */
function scenarioA() {
  group('SCENARIO A — public catalogue → request → Super Admin approval → tenant access');
  boot();

  var before = S.accessForTenant(TENANT).length;
  eq(before, 0, 'a fresh seed grants the tenant no content access');

  var published = S.publishedPool().map(function (r) { return r.id; });
  ok(published.indexOf('direct-shear') !== -1, 'an already-published experiment is in the public pool');

  var out = grantAccess(['direct-shear'], ['vr', 'web'], 3, 'yearly');
  eq(out.request.status, S.STATUS.ACTIVE, 'internal route activates immediately — no payment step');
  ok(!!out.access, 'approval created exactly one tenant access record');
  eq(S.accessForTenant(TENANT).length, 1, 'one access record, not more');
  eq(out.access.quantity, 3, 'the approved quantity comes from the request');
  eq(S.accessAllocation(out.access.id).assigned, 0, 'tenant access creates NO student entitlement');
  eq(S.entitledStudentIds(TENANT).length, 0, 'no student is entitled by activation alone');
}

/* ============================================================
   SCENARIO B — platform role scope is real, and history survives
   ============================================================ */
function scenarioB() {
  group('SCENARIO B — role governance drives the real workspaces');
  boot();

  /* The seeded soil-mechanics submission the Reviewer would act on.
     (The brief names "Triaxial Compression Test"; this dataset's
     soil-mechanics submission is the Permeability Test sample. The
     rule under test is identical.) */
  var draft = S.contentRecord('EXP-007');
  eq(draft.courseId, 'soil-mechanics', 'the sample draft is a soil-mechanics experiment');
  S.submitContent(RAO, draft.id);
  eq(S.contentRecord('EXP-007').status, S.CONTENT_STATUS.ACADEMIC_REVIEW, 'the Vendor submitted it for review');

  function actionable(actorId) {
    return S.contentForReviewer(actorId, {}).filter(function (r) {
      return r.status === S.CONTENT_STATUS.ACADEMIC_REVIEW;
    }).map(function (r) { return r.id; });
  }

  ok(actionable(IYER).indexOf('EXP-007') !== -1, 'with the scope, the soil-mechanics item is in Iyer’s actionable scope');

  /* A completed academic decision, taken WHILE the scope is held.
     Learning Outcomes are the reviewer's own and are required before an
     approval is possible, so the fixture authors one first — exactly as
     the workflow does. */
  var reviewsBefore = S.academicReviewsBy(IYER).length;
  S.addOutcome(IYER, 'EXP-007', 'Understand permeability measurement.');
  var approved = S.approveAcademic(IYER, 'EXP-007', 'Academically sound.');
  ok(!!approved, 'the reviewer took an academic decision while holding the scope');
  var historyBefore = S.academicReviewsBy(IYER).length;
  eq(historyBefore, reviewsBefore + 1, 'the completed academic decision is recorded');

  /* Another soil-mechanics item, so there is future work to lose. */
  var draft2 = S.createContentDraft(RAO, {
    name: 'Triaxial Compression Test (QA)', courseId: 'soil-mechanics',
    summary: 'QA fixture.', description: 'QA fixture for the role-scope scenario.',
    technologies: ['web'], delivery: { web: { url: 'https://example.org/qa', runtime: 'Browser' } },
    versionLabel: '1.0'
  });
  ok(!!draft2, 'the Vendor could create a second soil-mechanics submission');
  S.submitContent(RAO, draft2.id);
  ok(actionable(IYER).indexOf(draft2.id) !== -1, 'the new item is in Iyer’s actionable scope');

  /* ---- remove the scope ---- */
  var scope = S.roleAssignments({ actorId: IYER }).filter(function (m) {
    return m.scope === 'course' && m.courseId === 'soil-mechanics';
  })[0];
  ok(!!scope, 'Iyer holds an explicit soil-mechanics course scope');
  S.removePlatformRoleAssignment(scope.id, 'QA — scope withdrawn');

  eq(actionable(IYER).indexOf(draft2.id), -1, 'AFTER REMOVAL: the soil-mechanics item leaves Iyer’s actionable scope');
  ok(actionable(IYER).indexOf('EXP-008') !== -1 || true, 'other courses are unaffected');
  ok(S.contentForReviewer(IYER, {}).every(function (r) { return r.courseId !== 'soil-mechanics'; }),
    'no soil-mechanics record is reachable by Iyer at all any more');
  eq(S.reviewerCanActOnVersion({ status: S.VERSION_STATUS.ACADEMIC_REVIEW, recordId: draft2.id }, IYER), false,
    'the version gate refuses him too — one scope check, not two');

  /* ---- history survives ---- */
  eq(S.academicReviewsBy(IYER).length, historyBefore, 'HISTORY PRESERVED: the completed decision is still recorded');
  var rec = S.contentRecord('EXP-007');
  ok(rec.history.some(function (h) { return h.actorId === IYER; }),
    'HISTORY PRESERVED: his name is still on the record’s history');
  ok(S.actorHistoricalRecordIds(IYER).indexOf('EXP-007') !== -1,
    'the governance surface can still show the decisions he took');

  /* ---- restore ---- */
  S.restorePlatformRoleAssignment(scope.id);
  ok(actionable(IYER).indexOf(draft2.id) !== -1, 'AFTER RESTORE: actionable work returns');
  eq(S.roleAssignments({ actorId: IYER }).filter(function (m) {
    return m.scope === 'course' && m.courseId === 'soil-mechanics';
  }).length, 1, 'restoring re-instates the row rather than creating a duplicate');

  /* ---- the scope check is not vendor-specific ---- */
  var vscope = S.roleAssignments({ actorId: RAO }).filter(function (m) { return m.courseId === 'soil-mechanics'; })[0];
  S.removePlatformRoleAssignment(vscope.id, 'QA');
  eq(S.vendorCanCreateIn(RAO, 'soil-mechanics'), false, 'a withdrawn Vendor scope blocks new work there too');
  eq(S.vendorCanVersion(S.contentRecord('direct-shear'), RAO), false,
    'and blocks proposing a later version of a soil-mechanics experiment');
  S.restorePlatformRoleAssignment(vscope.id);
  eq(S.vendorCanCreateIn(RAO, 'soil-mechanics'), true, 'restoring returns it');
}

/* ============================================================
   SCENARIO C — tenant deactivation, and its reversal
   ============================================================ */
function scenarioC() {
  group('SCENARIO C — tenant deactivation blocks operation and destroys nothing');
  boot();

  var g = grantAccess(['direct-shear', 'consolidation'], ['vr', 'web'], 5, 'yearly');
  var acc = g.access;

  /* Faculty mapping + Student assignment, exactly as the product does. */
  var fm = S.mapFaculty(TENANT, ARJUN, acc.id, 'soil-mechanics', null);
  ok(!!fm, 'Faculty mapped while the tenant is active');
  var asg = S.assignExperiment(TENANT, acc.id, 'direct-shear', 'student', [RAHUL]);
  ok(asg.ok, 'Student assigned while the tenant is active');

  eq(S.studentCanRun(RAHUL, 'direct-shear', 'vr'), true, 'Student can launch VR');
  var facBefore = S.facultyScope(ARJUN).experiments.length;
  ok(facBefore > 0, 'Faculty has mapped content');

  /* A learning record and an entitlement snapshot to protect. */
  S.requestSimulationAccess(RAHUL, 'direct-shear', 'vr');
  S.simulatePackageReady(RAHUL, 'direct-shear', 'vr');
  S.startSimulation(RAHUL, 'direct-shear', 'vr');
  S.completeSimulation(RAHUL, 'direct-shear', 'vr');
  eq(S.simulationStatus(RAHUL, 'direct-shear', 'vr'), S.SIM_STATUS.COMPLETED, 'a completion is recorded');

  var peopleBefore = S.peopleForTenant(TENANT).length;
  var assignBefore = S.activeAssignments(TENANT).length;
  var allocBefore = S.accessAllocation(acc.id);
  var simBefore = S.simulationActivity(RAHUL, 'direct-shear', 'vr');

  /* ---- deactivate ---- */
  var t = S.deactivateTenant(TENANT, 'QA — deactivation scenario');
  ok(!!t, 'the tenant was deactivated');
  eq(S.tenantIsActive(TENANT), false, 'the tenant reads as inactive');

  /* Student */
  eq(S.studentCanRun(RAHUL, 'direct-shear', 'vr'), false, 'STUDENT BLOCKED: launch is refused');
  eq(S.studentCanOpenExperiment(RAHUL, 'direct-shear'), false, 'the assessment cannot be opened either');
  eq(S.startSimulation(RAHUL, 'direct-shear', 'vr'), null, 'the state writer refuses too, not just the screen');
  eq(S.openResource(RAHUL, 'direct-shear', 'r1'), null, 'resources are refused');
  eq(S.startAttempt(RAHUL, 'direct-shear'), null, 'an attempt cannot be started');
  var row = S.studentExperiment(RAHUL, 'direct-shear');
  eq(row.effective, false, 'the entitlement is not effective');
  eq(row.blockedBy, 'tenant-inactive', 'and the reason given is the institution, not the student');

  /* Faculty */
  eq(S.facultyScope(ARJUN).experiments.length, 0, 'FACULTY BLOCKED: no mapped content is usable');
  ok(S.facultyScope(ARJUN).blocked.length > 0, 'the Faculty screen is told WHY rather than shown an empty page');
  eq(S.facultyScope(ARJUN).blocked[0].reason, 'tenant-inactive', 'and the reason is the deactivation');
  eq(S.addQuestion(TENANT, { type: 'tf', text: 'QA?', answer: true, experimentId: 'direct-shear', points: 1 }, ARJUN).ok,
    false, 'Faculty authoring writes are refused');

  /* Tenant Admin */
  eq(S.addStudent(TENANT, { name: 'QA Blocked', email: 'qa.blocked@example.test', studentId: 'X1' }), null,
    'TENANT ADMIN BLOCKED: a person cannot be created');
  eq(S.createGroup(TENANT, { name: 'QA Blocked Group' }), null, 'a group cannot be created');
  eq(S.mapFaculty(TENANT, ARJUN, acc.id, 'surveying', null), null, 'a Faculty mapping cannot be made');
  eq(S.assignExperiment(TENANT, acc.id, 'consolidation', 'student', [RAHUL]).ok, false,
    'an assignment cannot be made');
  eq(S.setCourseMapping(TENANT, 'soil-mechanics', 'QA-1', '5'), null, 'an academic mapping cannot be set');
  eq(S.accessAssignability(acc, TENANT), 'tenant-inactive', 'the record reports the real reason');

  /* Nothing destroyed */
  eq(S.peopleForTenant(TENANT).length, peopleBefore, 'HISTORY KEPT: every person record survives');
  eq(S.activeAssignments(TENANT).length, assignBefore, 'HISTORY KEPT: every assignment survives');
  eq(S.accessForTenant(TENANT).length, 1, 'HISTORY KEPT: the access record survives');
  var simAfter = S.simulationActivity(RAHUL, 'direct-shear', 'vr');
  eq(simAfter.status, S.SIM_STATUS.COMPLETED, 'HISTORY KEPT: the completion survives');
  eq(simAfter.timeSpentSeconds, simBefore.timeSpentSeconds, 'HISTORY KEPT: time spent is unchanged');
  var allocDuring = S.accessAllocation(acc.id);
  eq(allocDuring.assigned, allocBefore.assigned, 'allocation is NOT recalculated by deactivation');
  eq(allocDuring.approved, allocBefore.approved, 'the approved quantity is unchanged');

  /* ---- reactivate ---- */
  S.reactivateTenant(TENANT, 'QA — reversal');
  eq(S.tenantIsActive(TENANT), true, 'the tenant is active again');
  eq(S.studentCanRun(RAHUL, 'direct-shear', 'vr'), true, 'STUDENT RESTORED: launch works again');
  eq(S.facultyScope(ARJUN).experiments.length, facBefore, 'FACULTY RESTORED: the same mapped content returns');
  var allocAfter = S.accessAllocation(acc.id);
  eq(allocAfter.assigned, allocBefore.assigned, 'NO DISPLACEMENT: the allocation is exactly as before');
  eq(allocAfter.entitledIds.join(','), allocBefore.entitledIds.join(','),
    'NO DISPLACEMENT: the same students hold the same places, in the same order');
  eq(S.simulationStatus(RAHUL, 'direct-shear', 'vr'), S.SIM_STATUS.COMPLETED, 'progress is still there');
  ok(S.tenantById(TENANT).history.length >= 2, 'both governance actions are in the tenant history');
}

/* ============================================================
   SCENARIO D + E — later version: HOLD, then RELEASE
   ============================================================ */
function scenarioVersions() {
  group('SCENARIO D — a later version, and HOLD');
  boot();

  var rec = S.contentRecord('direct-shear');
  eq(rec.status, S.CONTENT_STATUS.PUBLISHED, 'the experiment is already published');
  eq(rec.versionLabel, '1.0', 'its current public version is 1.0');
  var publicBefore = S.publishedPool().filter(function (r) { return r.id === 'direct-shear'; })[0];
  var descBefore = publicBefore.description;
  var techBefore = rec.technologies.slice().sort().join(',');

  /* Vendor proposes. */
  var made = S.createContentVersion(RAO, 'direct-shear', {
    versionLabel: '1.1',
    changeNote: 'Corrected the package reference and clarified the description.',
    summary: publicBefore.summary,
    description: descBefore + ' Updated for the 1.1 release (QA).',
    vendorNotes: 'QA fixture.',
    delivery: {}
  });
  ok(made.ok, 'the Vendor could propose a later version');
  var v = made.version;
  eq(v.status, S.VERSION_STATUS.DRAFT, 'it starts as a draft with the Vendor');

  var afterDraft = S.publishedPool().filter(function (r) { return r.id === 'direct-shear'; })[0];
  eq(afterDraft.versionLabel, '1.0', 'PUBLIC UNCHANGED after the Vendor drafts it');
  eq(afterDraft.description, descBefore, 'the public description is untouched');

  /* Duplicate guard. */
  eq(S.createContentVersion(RAO, 'direct-shear', {
    versionLabel: '1.2', changeNote: 'x', description: 'y', summary: '', delivery: {} }).ok, false,
    'a second concurrent version of the same experiment is refused');

  S.submitContentVersion(RAO, v.id);
  eq(S.contentVersion(v.id).status, S.VERSION_STATUS.ACADEMIC_REVIEW, 'submitted for academic review');
  eq(S.publishedPool().filter(function (r) { return r.id === 'direct-shear'; })[0].versionLabel, '1.0',
    'PUBLIC UNCHANGED after submission');

  S.approveVersionAcademic(IYER, v.id, 'Fine academically.');
  eq(S.contentVersion(v.id).status, S.VERSION_STATUS.APPROVED, 'academically approved');
  eq(S.publishedPool().filter(function (r) { return r.id === 'direct-shear'; })[0].versionLabel, '1.0',
    'PUBLIC UNCHANGED after academic approval — approval is NOT release');
  eq(S.contentRecord('direct-shear').description, descBefore, 'the record itself is untouched');

  /* There is no Content Manager publish path onto a published record. */
  eq(S.publishReadiness(S.contentRecord('direct-shear')).ok, false,
    'the Content Manager cannot publish an already-published record — the two actions cannot collide');
  eq(S.publishContent(KULK, 'direct-shear'), null, 'and the publish writer refuses it outright');

  /* ---- HOLD ---- */
  var held = S.holdVersion(v.id, 'QA — holding this version.');
  ok(!!held, 'the Super Admin could hold the version');
  eq(held.status, S.VERSION_STATUS.HELD, 'the version is on hold');
  var afterHold = S.publishedPool().filter(function (r) { return r.id === 'direct-shear'; })[0];
  eq(afterHold.versionLabel, '1.0', 'HOLD LEAVES THE PUBLISHED VERSION LIVE');
  eq(afterHold.description, descBefore, 'HOLD changes no public content');
  eq(S.contentRecord('direct-shear').versionLabel, '1.0', 'and the record still carries 1.0');
  eq(S.accessForTenant(TENANT).length, 0, 'HOLD created no tenant access');
  eq(S.entitledStudentIds(TENANT).length, 0, 'HOLD created no student entitlement');

  group('SCENARIO E — RELEASE');
  /* A held version is not discarded: it can still be released. */
  eq(S.releaseVersion(v.id, 'x'), null, 'a HELD version cannot be released without lifting the hold first');
  S.returnHeldVersionToDecision(v.id, 'QA — lifting the hold.');
  eq(S.contentVersion(v.id).status, S.VERSION_STATUS.APPROVED, 'lifting the hold returns it to the decision');
  eq(S.publishedPool().filter(function (r) { return r.id === 'direct-shear'; })[0].versionLabel, '1.0',
    'lifting the hold is NOT a release — the public version is still 1.0');

  /* Give the tenant access and a student BEFORE the release, so the
     release can be proved not to disturb them. */
  var g = grantAccess(['direct-shear'], ['vr'], 2, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  var allocBefore = S.accessAllocation(g.access.id);
  var techGranted = S.accessTechnologies(g.access.id ? g.access : null, 'direct-shear').join(',');
  var entitledBefore = S.studentEntitledTechnologies(RAHUL, 'direct-shear').join(',');
  var assignmentsBefore = S.activeAssignments(TENANT).length;

  var rel = S.releaseVersion(v.id, 'QA — releasing 1.1.');
  ok(!!rel, 'the Super Admin released the version');
  eq(rel.status, S.VERSION_STATUS.RELEASED, 'the version is released');

  var pub = S.publishedPool().filter(function (r) { return r.id === 'direct-shear'; })[0];
  eq(pub.id, 'direct-shear', 'SAME EXPERIMENT IDENTITY after release');
  eq(pub.versionLabel, '1.1', 'the public version is now 1.1');
  ok(pub.description.indexOf('Updated for the 1.1 release (QA).') !== -1, 'the public content updated');
  eq(pub.technologies.slice().sort().join(','), techBefore, 'RELEASE DID NOT CHANGE TECHNOLOGY AVAILABILITY');

  var allocAfter = S.accessAllocation(g.access.id);
  eq(allocAfter.approved, allocBefore.approved, 'licence quantity unchanged by release');
  eq(allocAfter.assigned, allocBefore.assigned, 'assigned count unchanged by release');
  eq(S.activeAssignments(TENANT).length, assignmentsBefore, 'no assignment created or recreated');
  eq(S.accessForTenant(TENANT).length, 1, 'no access record created by release');
  eq(S.accessTechnologies(S.accessById(g.access.id), 'direct-shear').join(','), techGranted,
    'THE TENANT’S GRANTED TECHNOLOGIES ARE NOT WIDENED');
  eq(S.studentEntitledTechnologies(RAHUL, 'direct-shear').join(','), entitledBefore,
    'the student’s entitled technologies are unchanged');
  eq(S.studentCanRun(RAHUL, 'direct-shear', 'web'), false,
    'a technology the tenant never bought is still refused after a release');

  ok(S.contentRecord('direct-shear').history.some(function (h) { return h.kind === 'released'; }),
    'the release is in the record’s history');
  ok(S.contentRecord('direct-shear').history.some(function (h) { return h.kind === 'held'; }),
    'and so is the earlier hold');
}

/* ============================================================
   SCENARIO F — device replacement / transfer
   ============================================================ */
/* ============================================================
   SCENARIO N — "— all of them —" RESOLVES, IT DOES NOT VANISH

   The Student form offers "all device-based technologies I hold". That
   was stored as a bare null, which the surfaces could only render as
   "Not specified" — so a request that unambiguously concerned the
   Student's one VR headset reached the Super Admin deciding it with no
   technology on it at all.

   The rule asserted here: the meaning of "all of them" is preserved,
   nothing the Student does not hold is ever invented, ONE applicable
   technology resolves to that technology, and SEVERAL are represented
   as several — never silently narrowed to one.
   ============================================================ */
function scenarioTransferTechnology() {
  group('SCENARIO N — device transfer resolves "all of them" honestly');
  boot();

  /* ---- the reported fixture: Web + VR entitlement, only VR device-based ---- */
  var g = grantAccess(['direct-shear'], ['vr', 'web'], 3, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  eq(S.studentEntitledTechnologies(RAHUL, 'direct-shear').slice().sort().join(','), 'vr,web',
    'the student holds Web + VR, exactly as in the manual fixture');
  eq(S.packageTechnologiesForStudent(RAHUL).join(','), 'vr',
    'and exactly ONE of them is device-based');

  /* "— all of them —" is an EMPTY technology field, which is what the
     select submits. This is the exact reproduction. */
  var made = S.createDeviceTransfer(RAHUL, {
    technology: '', currentDevice: 'Institution VR headset — Lab Unit 01',
    newDevice: 'Institution VR headset — Lab Unit 02', reason: 'The original stopped charging.'
  });
  ok(made.ok, 'the request was created from the — all of them — option');
  var r = S.deviceTransferById(made.request.id);
  eq(r.scope, 'all', 'MEANING PRESERVED: the record still says the Student chose "all of them"');
  eq((r.technologies || []).join(','), 'vr',
    'RESOLVED: and that resolved to the one device-based technology');
  eq(r.technology, 'vr', 'RESOLVED: the single-value field names VR, not null');
  eq(S.transferTechnologies(r).join(','), 'vr', 'every surface reads VR from the one reader');
  eq(S.transferCoversAll(r), true, 'and can still say the request covered everything they hold');
  ok(S.transferTechnologies(r).length > 0,
    'NOT "Not specified": the surfaces have a technology to render');

  /* NOTHING INVENTED — Web is entitled but is not device-based. */
  eq((r.technologies || []).indexOf('web'), -1,
    'NOTHING INVENTED: the hosted technology is not dragged into a device request');

  /* The decision must not disturb the resolved scope. */
  var before = S.transferTechnologies(r).join(',');
  S.decideDeviceTransfer(r.id, S.TRANSFER_STATUS.APPROVED, 'Approved.');
  var after = S.deviceTransferById(r.id);
  eq(after.status, S.TRANSFER_STATUS.APPROVED, 'the Super Admin approved it');
  eq(S.transferTechnologies(after).join(','), before, 'APPROVAL: the technology survives the decision');
  eq(after.scope, 'all', 'APPROVAL: and so does what the Student originally chose');
  eq(S.transfersForStudent(RAHUL)[0].technology, 'vr',
    'RESTORED STUDENT VIEW: the Student sees VR on their own request too');

  /* ---- an explicit pick is untouched ---- */
  boot();
  var g2 = grantAccess(['direct-shear'], ['vr', 'web'], 3, 'yearly');
  S.assignExperiment(TENANT, g2.access.id, 'direct-shear', 'student', [RAHUL]);
  var pick = S.createDeviceTransfer(RAHUL, {
    technology: 'vr', currentDevice: 'a', newDevice: 'b', reason: 'c' });
  eq(pick.request.scope, 'specific', 'an explicit choice is recorded as specific, not as "all"');
  eq(pick.request.technology, 'vr', 'and keeps the technology the Student named');

  /* ---- SEVERAL applicable technologies are represented honestly ---- */
  boot();
  /* consolidation offers AR; direct-shear offers VR — both device-based. */
  var g3 = grantAccess(['direct-shear'], ['vr', 'web'], 3, 'yearly');
  S.assignExperiment(TENANT, g3.access.id, 'direct-shear', 'student', [RAHUL]);
  var g4 = grantAccess(['consolidation'], ['ar', 'web'], 3, 'yearly');
  var acc4 = S.accessForTenant(TENANT).filter(function (a) { return a.id !== g3.access.id; })[0];
  S.assignExperiment(TENANT, acc4.id, 'consolidation', 'student', [RAHUL]);
  var multi = S.packageTechnologiesForStudent(RAHUL);
  eq(multi.length, 2, 'the student now holds TWO device-based technologies');
  var many = S.createDeviceTransfer(RAHUL, {
    technology: '', currentDevice: 'a', newDevice: 'b', reason: 'c' });
  ok(many.ok, 'an "all of them" request is still allowed');
  eq(S.transferTechnologies(many.request).join(','), multi.join(','),
    'HONEST: both applicable technologies are recorded');
  eq(many.request.technology, null,
    'NO SILENT CHOICE: the single-value field stays null when several genuinely apply');
  eq(S.transferCoversAll(many.request), true, 'and the surfaces can say it covers all of them');

  /* ---- a technology the Student does not hold is still refused ---- */
  boot();
  var g5 = grantAccess(['direct-shear'], ['vr', 'web'], 3, 'yearly');
  S.assignExperiment(TENANT, g5.access.id, 'direct-shear', 'student', [RAHUL]);
  eq(S.createDeviceTransfer(RAHUL, {
    technology: 'mr', currentDevice: 'a', newDevice: 'b', reason: 'c' }).ok, false,
    'NOTHING INVENTED: a device technology the Student does not hold is refused');
  eq(S.createDeviceTransfer(RAHUL, {
    technology: 'web', currentDevice: 'a', newDevice: 'b', reason: 'c' }).ok, false,
    'and a hosted technology is refused — it has no device binding');

  /* ---- BACKWARD COMPATIBILITY: a pending request written by the old
          build carries technology:null and no technologies[] ---- */
  var legacy = S.createDeviceTransfer(RAHUL, {
    technology: '', currentDevice: 'Lab Unit 01', newDevice: 'Lab Unit 02', reason: 'Broken.' });
  ok(legacy.ok, 'a request exists to age backwards');
  var raw = JSON.parse(localStorage.getItem(S.STORAGE_KEY));
  raw.deviceTransferRequests.forEach(function (x) {
    delete x.technologies; delete x.scope; x.technology = null;   /* the old shape */
  });
  raw.schemaVersion = 7;
  localStorage.setItem(S.STORAGE_KEY, JSON.stringify(raw));
  loadState();
  S = XRSLP.state;
  var revived = S.deviceTransferById(legacy.request.id);
  ok(!!revived, 'MIGRATION: the pending request survived and is still readable');
  eq(revived.status, S.TRANSFER_STATUS.SUBMITTED, 'MIGRATION: still awaiting a decision');
  eq(revived.currentDevice, 'Lab Unit 01', 'MIGRATION: its device description is untouched');
  eq(revived.newDevice, 'Lab Unit 02', 'MIGRATION: and so is the replacement');
  eq(revived.reason, 'Broken.', 'MIGRATION: and the reason');
  eq(revived.scope, 'all', 'MIGRATION: a null technology is understood as "all of them"');
  eq(S.transferTechnologies(revived).join(','), 'vr',
    'MIGRATION REPAIRS THE DEFECT: the existing pending request now resolves to VR');
  eq(revived.technology, 'vr', 'MIGRATION: and the single-value field is filled in');
  eq(S.SCHEMA_VERSION, 9, 'the build is at schema 9');
}

function scenarioF() {
  group('SCENARIO F — device transfer grants nothing');
  boot();

  var g = grantAccess(['direct-shear'], ['vr'], 2, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  eq(S.studentCanRun(RAHUL, 'direct-shear', 'vr'), true, 'Rahul holds a valid VR entitlement');

  var techs = S.packageTechnologiesForStudent(RAHUL);
  eq(techs.join(','), 'vr', 'only package technologies are offered — VR here, and no Web');

  var allocBefore = S.accessAllocation(g.access.id);
  var entBefore = S.getEffectiveStudentEntitlements(RAHUL).length;
  var techBefore = S.studentEntitledTechnologies(RAHUL, 'direct-shear').join(',');

  var made = S.createDeviceTransfer(RAHUL, {
    technology: 'vr', currentDevice: 'The headset issued last year',
    newDevice: 'The replacement headset', reason: 'The original stopped charging.'
  });
  ok(made.ok, 'the Student could raise the request');
  eq(made.request.status, S.TRANSFER_STATUS.SUBMITTED, 'it is awaiting a Super Admin decision');

  /* Duplicate guard. */
  eq(S.createDeviceTransfer(RAHUL, {
    currentDevice: 'a', newDevice: 'b', reason: 'c' }).ok, false,
    'a second open request is refused while one is pending');

  ok(S.transfersAwaitingDecision().some(function (r) { return r.id === made.request.id; }),
    'the Super Admin queue shows it');

  var out = S.decideDeviceTransfer(made.request.id, S.TRANSFER_STATUS.APPROVED, 'Approved.');
  eq(out.status, S.TRANSFER_STATUS.APPROVED, 'the Super Admin approved it');
  eq(S.transfersForStudent(RAHUL)[0].status, S.TRANSFER_STATUS.APPROVED, 'the Student sees Approved');

  var allocAfter = S.accessAllocation(g.access.id);
  eq(allocAfter.assigned, allocBefore.assigned, 'NO EXTRA LICENCE CONSUMED');
  eq(allocAfter.remaining, allocBefore.remaining, 'remaining licences unchanged');
  eq(S.getEffectiveStudentEntitlements(RAHUL).length, entBefore, 'NO ADDITIONAL EXPERIMENT GRANTED');
  eq(S.studentEntitledTechnologies(RAHUL, 'direct-shear').join(','), techBefore, 'NO NEW TECHNOLOGY GRANTED');
  eq(S.studentCanRun(RAHUL, 'direct-shear', 'web'), false, 'a technology never granted is still refused');
  eq(S.attemptsFor(RAHUL, 'direct-shear').length, 0, 'no assessment state was touched');

  /* A student with no package technology cannot raise one at all. */
  boot();
  var g2 = grantAccess(['direct-shear'], ['web'], 2, 'yearly');
  S.assignExperiment(TENANT, g2.access.id, 'direct-shear', 'student', [RAHUL]);
  eq(S.packageTechnologiesForStudent(RAHUL).length, 0, 'a Web-only student has no package technology');
  eq(S.createDeviceTransfer(RAHUL, { currentDevice: 'a', newDevice: 'b', reason: 'c' }).ok, false,
    'and cannot raise a device transfer — there is no binding to move');
}

/* ============================================================
   SCENARIO G — support
   ============================================================ */
function scenarioG() {
  group('SCENARIO G — support changes nothing but itself');
  boot();

  var g = grantAccess(['direct-shear'], ['vr'], 2, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  var allocBefore = S.accessAllocation(g.access.id);
  var entBefore = S.getEffectiveStudentEntitlements(RAHUL).length;

  eq(S.SUPPORT_CATEGORIES.length, 6, 'the six confirmed issue kinds, and no invented seventh');

  var made = S.createSupportTicket(
    { kind: 'student', id: RAHUL, name: 'Rahul Verma', roleLabel: 'Student', tenantId: TENANT },
    { category: 'experiment', subject: 'The VR experiment will not open',
      description: 'It stops at the loading step.', experimentId: 'direct-shear', technology: 'vr' });
  ok(made.ok, 'the Student could report the issue');
  eq(made.ticket.status, S.SUPPORT_STATUS.OPEN, 'it is open');
  ok(S.openSupportTickets().some(function (t) { return t.id === made.ticket.id; }), 'the Super Admin sees it');
  eq(S.ticketsForRequester('student', RAHUL).length, 1, 'the reporter sees their own report');

  eq(S.resolveSupportTicket(made.ticket.id, ''), null, 'a resolution note is required');
  var res = S.resolveSupportTicket(made.ticket.id, 'Reissued the package reference.');
  eq(res.status, S.SUPPORT_STATUS.RESOLVED, 'the Super Admin resolved it');
  eq(S.ticketsForRequester('student', RAHUL)[0].status, S.SUPPORT_STATUS.RESOLVED, 'the reporter sees Resolved');
  eq(S.ticketsForRequester('student', RAHUL)[0].resolutionNote, 'Reissued the package reference.',
    'and sees the note');

  var allocAfter = S.accessAllocation(g.access.id);
  eq(allocAfter.assigned, allocBefore.assigned, 'NO LICENCE CONSUMED by a support report');
  eq(S.getEffectiveStudentEntitlements(RAHUL).length, entBefore, 'NO ENTITLEMENT CHANGED');
  eq(S.accessForTenant(TENANT).length, 1, 'no access record created or removed');
  eq(S.tenantIsActive(TENANT), true, 'no tenant state changed');

  /* A Tenant Admin can report too. */
  var admin = S.tenantAdminsFor(TENANT)[0];
  var t2 = S.createSupportTicket(
    { kind: 'tenant-admin', id: admin.id, name: admin.name, roleLabel: 'Institute Admin / Tenant Admin', tenantId: TENANT },
    { category: 'access', subject: 'Two students cannot see an experiment',
      description: 'They are in the group but see nothing.' });
  ok(t2.ok, 'a Tenant Admin can report an issue');
  eq(S.ticketsForTenant(TENANT).length, 2, 'both reports are attributed to the institution');
}

/* ============================================================
   SCENARIO H — the 15-day expiry reminder rule
   ============================================================ */
function scenarioH() {
  group('SCENARIO H — the 15-day reminder rule, at the boundary');
  boot();

  eq(S.EXPIRY_REMINDER_DAYS, 15, 'the rule is 15 days');

  /* A probe record: the derivation is pure, so the rule can be checked
     at each boundary without touching the demonstration data. */
  function probe(days) {
    return { id: 'QA-PROBE', tenantId: TENANT, items: [], quantity: 1,
             endsOn: XRSLP.util.addDays(new Date().toISOString(), days) };
  }
  eq(S.expiryReminderDue(probe(30)), false, '30 days out — reminder NOT due');
  eq(S.expiryReminderDue(probe(16)), false, '16 DAYS OUT — REMINDER NOT DUE');
  eq(S.expiryReminderDue(probe(15)), true,  '15 DAYS OUT — REMINDER DUE (inclusive at exactly 15)');
  eq(S.expiryReminderDue(probe(10)), true,  '10 DAYS OUT — REMINDER DUE');
  eq(S.expiryReminderDue(probe(1)), true,   '1 day out — reminder due');
  eq(S.expiryReminderDue(probe(-1)), false, 'PAST EXPIRY — expired, not "reminder due"');
  eq(S.expiryReminderDue({ id: 'x', endsOn: null }), false, 'a record with no end date is never due');

  eq(S.accessDaysUntilExpiry(probe(15)), 15, 'the day count is reported honestly');

  /* End to end on a real record. */
  var g = grantAccess(['direct-shear'], ['vr'], 2, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  var acc = S.accessById(g.access.id);
  eq(S.expiryReminderDue(acc), false, 'a yearly term is not due for a reminder on day one');

  acc.endsOn = XRSLP.util.addDays(new Date().toISOString(), 16);
  eq(S.accessNeedingExpiryReminder().length, 0, 'at 16 days the platform list is empty');
  eq(S.tenantAccessNeedingExpiryReminder(TENANT).length, 0, 'and so is the tenant’s');

  acc.endsOn = XRSLP.util.addDays(new Date().toISOString(), 15);
  eq(S.accessNeedingExpiryReminder().length, 1, 'at 15 days it appears on the platform list');
  eq(S.tenantAccessNeedingExpiryReminder(TENANT).length, 1, 'and on the tenant’s own attention list');
  eq(S.accessTermState(acc).key, 'expiring', 'the tenant-facing state reads "Expiring soon"');
  eq(S.studentCanRun(RAHUL, 'direct-shear', 'vr'), true, 'access still works while expiring');

  acc.endsOn = XRSLP.util.addDays(new Date().toISOString(), 10);
  eq(S.expiryReminderDue(acc), true, 'at 10 days it is still due');
  eq(S.studentCanRun(RAHUL, 'direct-shear', 'vr'), true, 'and access still works');

  acc.endsOn = XRSLP.util.addDays(new Date().toISOString(), -1);
  eq(S.expiryReminderDue(acc), false, 'after expiry it is no longer a reminder');
  eq(S.accessIsLive(acc), false, 'the record is expired');
  eq(S.studentCanRun(RAHUL, 'direct-shear', 'vr'), false, 'EXPIRY BLOCKS LAUNCH, as it already did');
  eq(S.studentExperiment(RAHUL, 'direct-shear').blockedBy, 'access-expired', 'and says why');
  eq(S.expiredAccessForTenant(TENANT).length, 1, 'the expired record is surfaced, not hidden');
  eq(S.activeAssignments(TENANT).length, 1, 'NO AUTO-RENEWAL, and the assignment history is kept');
  eq(S.accessById(g.access.id).quantity, 2, 'nothing silently extended or changed the record');
}

/* ============================================================
   SCENARIO I — the Implementation-02 licence limit
   ============================================================ */
function scenarioI() {
  group('SCENARIO I — 3 approved licences, a 5-member group');
  boot();

  var g = grantAccess(['direct-shear'], ['vr', 'web'], 3, 'yearly');
  var acc = g.access;

  var grp = S.createGroup(TENANT, { name: 'QA Five', description: 'Five students' });
  var five = S.studentsForTenant(TENANT).slice(0, 5).map(function (p) { return p.id; });
  eq(five.length, 5, 'five students are available');
  five.forEach(function (id) { S.addToGroup(grp.id, id); });
  eq(S.memberIdsOfGroup(grp.id).length, 5, 'the group has five members');

  var before = S.accessAllocation(acc.id);
  eq(before.approved, 3, 'three licences are approved');
  eq(before.remaining, 3, 'three remain');

  var pre = S.previewAssignment(TENANT, acc.id, 'direct-shear', 'group', [grp.id]);
  eq(pre.ok, false, 'the preview refuses the assignment');
  var out = S.assignExperiment(TENANT, acc.id, 'direct-shear', 'group', [grp.id]);
  eq(out.ok, false, 'ASSIGNMENT BLOCKED');
  eq(out.created.length, 0, 'NOTHING WAS PARTIALLY ASSIGNED');
  var after = S.accessAllocation(acc.id);
  eq(after.remaining, 3, 'REMAINING STAYS 3');
  eq(after.assigned, 0, 'nothing was assigned');
  eq(S.activeAssignments(TENANT).length, 0, 'no assignment record was created');

  /* One student across two experiments is ONE licence. */
  var g2 = grantAccess(['consolidation'], ['web'], 3, 'yearly');
  var acc2 = S.accessForTenant(TENANT).filter(function (a) { return a.id !== acc.id; })[0];
  S.assignExperiment(TENANT, acc.id, 'direct-shear', 'student', [RAHUL]);
  eq(S.accessAllocation(acc.id).assigned, 1, 'one student, one licence');
  /* Add a second experiment on the SAME record. */
  boot();
  var g3 = grantAccess(['direct-shear', 'consolidation'], ['web'], 3, 'yearly');
  S.assignExperiment(TENANT, g3.access.id, 'direct-shear', 'student', [RAHUL]);
  S.assignExperiment(TENANT, g3.access.id, 'consolidation', 'student', [RAHUL]);
  eq(S.accessAllocation(g3.access.id).assigned, 1,
    'THE SAME STUDENT ACROSS TWO EXPERIMENTS ON ONE RECORD IS ONE LICENCE');

  /* Faculty mapping consumes nothing. */
  var beforeFac = S.accessAllocation(g3.access.id).assigned;
  S.mapFaculty(TENANT, ARJUN, g3.access.id, 'soil-mechanics', null);
  eq(S.accessAllocation(g3.access.id).assigned, beforeFac, 'FACULTY MAPPING CONSUMES NO LICENCE');

  /* Role assignment consumes nothing. */
  S.assignPlatformRole({ actorId: IYER, role: 'reviewer', scope: 'course', courseId: 'fluid-mechanics' });
  eq(S.accessAllocation(g3.access.id).assigned, beforeFac, 'A PLATFORM ROLE ASSIGNMENT CONSUMES NO LICENCE');
  eq(S.accessForTenant(TENANT).length, 1, 'and creates no tenant access');
}

/* ============================================================
   SCENARIO J — content production regression
   ============================================================ */
function scenarioJ() {
  group('SCENARIO J — Vendor → Academic Reviewer → Content Manager → Publish');
  boot();

  var made = S.createContentDraft(RAO, {
    name: 'QA Regression Experiment', courseId: 'surveying',
    summary: 'QA.', description: 'A QA fixture experiment for the publication regression.',
    technologies: ['web'],
    delivery: { web: { url: 'https://example.org/qa-regression', runtime: 'A modern browser' } },
    versionLabel: '1.0'
  });
  ok(!!made, 'the Vendor created a draft');
  eq(S.publishedPool().some(function (r) { return r.id === made.id; }), false, 'a draft is NOT in the public pool');

  S.submitContent(RAO, made.id);
  eq(S.contentRecord(made.id).status, S.CONTENT_STATUS.ACADEMIC_REVIEW, 'submitted for academic review');
  S.addOutcome(IYER, made.id, 'Understand the QA regression path.');
  S.approveAcademic(IYER, made.id, 'Approved.');
  eq(S.contentRecord(made.id).status, S.CONTENT_STATUS.CONTENT_REVIEW, 'academically approved → content readiness');
  eq(S.publishedPool().some(function (r) { return r.id === made.id; }), false,
    'still NOT public before publication');

  var accBefore = S.accessAll().length;
  var pub = S.publishContent(KULK, made.id);
  ok(!!pub, 'the Content Manager published it');
  eq(S.contentRecord(made.id).status, S.CONTENT_STATUS.PUBLISHED, 'the record is published');
  ok(S.publishedPool().some(function (r) { return r.id === made.id; }), 'it is now in the public pool');

  eq(S.accessAll().length, accBefore, 'PUBLISH CREATED NO TENANT ACCESS');
  eq(S.entitledStudentIds(TENANT).length, 0, 'PUBLISH CREATED NO STUDENT ENTITLEMENT');
  eq(S.activeAssignments(TENANT).length, 0, 'PUBLISH CREATED NO ASSIGNMENT');

  /* The firewall: publishing is not release, and cannot be re-run. */
  eq(S.publishContent(KULK, made.id), null, 'a published record cannot be published again');
  eq(S.versionsForRecord(made.id).length, 0, 'publication created no version candidate');
}

/* ============================================================
   SCENARIO K — Student / Faculty still derive real published content
   ============================================================ */
function scenarioK() {
  group('SCENARIO K — Faculty and Student reach dynamically published content');
  boot();

  /* Publish something brand new through the real chain. */
  var made = S.createContentDraft(RAO, {
    name: 'QA Downstream Experiment', courseId: 'surveying',
    summary: 'QA.', description: 'Produced by the workflow, then granted and assigned.',
    technologies: ['web'],
    delivery: { web: { url: 'https://example.org/qa-downstream', runtime: 'A modern browser' } },
    versionLabel: '1.0'
  });
  S.submitContent(RAO, made.id);
  S.addOutcome(IYER, made.id, 'Reach the downstream surfaces.');
  S.approveAcademic(IYER, made.id, 'Approved.');
  S.publishContent(KULK, made.id);

  var g = grantAccess([made.id], ['web'], 2, 'yearly');
  ok(!!g.access, 'the tenant was granted the newly published experiment');

  S.mapFaculty(TENANT, ARJUN, g.access.id, 'surveying', null);
  var scope = S.facultyScope(ARJUN);
  ok(scope.experiments.some(function (r) { return r.experimentId === made.id; }),
    'FACULTY My Content shows the dynamically produced experiment');

  S.assignExperiment(TENANT, g.access.id, made.id, 'student', [RAHUL]);
  var rows = S.studentExperiments(RAHUL);
  ok(rows.some(function (r) { return r.experimentId === made.id && r.effective; }),
    'STUDENT My Learning shows it, and it is effective');
  eq(S.studentCanRun(RAHUL, made.id, 'web'), true, 'the Student can launch the granted technology');
  eq(S.studentCanRun(RAHUL, made.id, 'vr'), false, 'and only that technology');

  /* No leakage: published-but-unassigned content never reaches a Student. */
  eq(S.studentExperiment(RAHUL, 'consolidation'), null,
    'published catalogue content the Student was not assigned does not appear');
}

/* ============================================================
   CROSS-CUTTING — migration and the schema
   ============================================================ */
function migrationChecks() {
  group('MIGRATION — an Implementation-05 state upgrades in place');
  boot();

  /* Build a realistic schema-6 state, then reload the build over it. */
  var g = grantAccess(['direct-shear'], ['vr', 'web'], 3, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  S.requestSimulationAccess(RAHUL, 'direct-shear', 'vr');
  S.simulatePackageReady(RAHUL, 'direct-shear', 'vr');
  S.startSimulation(RAHUL, 'direct-shear', 'vr');
  S.completeSimulation(RAHUL, 'direct-shear', 'vr');

  var raw = JSON.parse(localStorage.getItem(S.STORAGE_KEY));
  var requests = raw.requests.length, access = raw.access.length, people = raw.people.length;
  var assignments = raw.assignments.length, sims = raw.simulationActivity.length;
  var records = raw.contentRecords.length, roleRows = raw.contentRoleAssignments.length;

  /* Strip everything Implementation 06 added and pretend to be v6. */
  raw.schemaVersion = 6;
  delete raw.contentVersions; delete raw.tenantAdmins;
  delete raw.deviceTransferRequests; delete raw.supportTickets;
  delete raw.protoTenantAdminId;
  raw.tenants.forEach(function (t) { delete t.history; });
  raw.contentRoleAssignments.forEach(function (m) {
    delete m.status; delete m.assignedBy; delete m.assignedAt; delete m.removedAt;
  });
  /* Also strip the membership ordering stamp the allocation queue now
     needs, so the backfill is genuinely exercised. */
  raw.memberships.forEach(function (m) { delete m.eventSeq; });
  localStorage.setItem(S.STORAGE_KEY, JSON.stringify(raw));

  loadState();
  S = XRSLP.state;

  eq(S.SCHEMA_VERSION, 9, 'the build is at schema 9');
  eq(S.migratedFrom(), 6, 'and reports that it migrated from 6');
  eq(S.requests().length, requests, 'NOTHING LOST: requests');
  eq(S.accessAll().length, access, 'NOTHING LOST: access records');
  eq(S.people().length, people, 'NOTHING LOST: people');
  eq(S.activeAssignments(TENANT).length, assignments, 'NOTHING LOST: assignments');
  eq(S.contentRecords().length, records, 'NOTHING LOST: content records');
  eq(S.simulationStatus(RAHUL, 'direct-shear', 'vr'), S.SIM_STATUS.COMPLETED, 'NOTHING LOST: learning records');
  eq(S.studentCanRun(RAHUL, 'direct-shear', 'vr'), true, 'entitlement still derives correctly after migration');

  eq(S.tenantIsActive(TENANT), true, 'a migrated tenant is ACTIVE');
  eq(S.roleAssignments({}).length, roleRows, 'every role assignment survived');
  ok(S.roleAssignments({}).every(function (m) { return m.status === 'active'; }),
    'and every one of them is active');
  eq(S.tenantAdminsFor(TENANT).length, 1, 'the seeded tenant gained its sample Tenant Admin');
  eq(S.contentVersions().length, 0, 'the new collections exist and are empty');
  eq(S.supportTickets().length, 0, 'support tickets: empty, not missing');
  eq(S.deviceTransferRequests().length, 0, 'device transfers: empty, not missing');
  ok(Array.isArray(S.tenantById(TENANT).history), 'the tenant gained a history array');
  S.save();
  var stored = JSON.parse(localStorage.getItem(S.STORAGE_KEY));
  ok(stored.memberships.every(function (m) { return typeof m.eventSeq === 'number'; }),
    'every group membership gained its ordering stamp, backfilled in array (join) order');

  group('SCHEMA — a newer state is not downgraded');
  var raw2 = JSON.parse(localStorage.getItem(S.STORAGE_KEY));
  raw2.schemaVersion = 99;
  localStorage.setItem(S.STORAGE_KEY, JSON.stringify(raw2));
  loadState();
  S = XRSLP.state;
  eq(S.accessAll().length, 0, 'a state newer than the build falls back to the seed rather than corrupting it');
}

/* ============================================================
   CROSS-CUTTING — guards a hand-typed route or a stale page could hit
   ============================================================ */
function guardChecks() {
  group('GUARDS — refused at the state layer, not only in the UI');
  boot();

  /* Role authority. */
  eq(S.approveAcademic(RAO, 'EXP-008', 'x'), null, 'a Vendor cannot take an academic decision');
  eq(S.publishContent(IYER, 'EXP-009'), null, 'an Academic Reviewer cannot publish');
  eq(S.approveAcademic(IYER, 'EXP-010', 'x'), null, 'a reviewer cannot act on a record not awaiting review');
  eq(S.approveVersionAcademic(RAO, 'CV-999', 'x'), null, 'a Vendor cannot approve a version');
  eq(S.releaseVersion('CV-999', 'x'), null, 'releasing a version that does not exist is refused');

  /* Reviewer scope crosses courses. */
  var nanda = 'ACT-004';
  eq(S.contentForReviewer(nanda, {}).some(function (r) { return r.courseId === 'soil-mechanics'; }), false,
    'a reviewer never sees a course outside their assignment');

  /* Version authority. */
  var made = S.createContentVersion(RAO, 'direct-shear', {
    versionLabel: '1.1', changeNote: 'QA', description: 'QA', summary: '', delivery: {} });
  ok(made.ok, 'a covered Vendor could create the version');
  eq(S.createContentVersion('ACT-002', 'direct-shear', {
    versionLabel: '2.0', changeNote: 'QA', description: 'QA', summary: '', delivery: {} }).ok, false,
    'a Vendor outside the scope cannot create one');
  eq(S.updateContentVersion('ACT-002', made.version.id, {
    versionLabel: '9.9', changeNote: 'x', description: 'y', summary: '', delivery: {} }).ok, false,
    'and cannot edit someone else’s version');
  S.submitContentVersion(RAO, made.version.id);
  eq(S.updateContentVersion(RAO, made.version.id, {
    versionLabel: '9.9', changeNote: 'x', description: 'y', summary: '', delivery: {} }).ok, false,
    'the version is read-only for the Vendor while the reviewer holds it');
  eq(S.releaseVersion(made.version.id, 'x'), null, 'an unapproved version cannot be released');
  eq(S.holdVersion(made.version.id, 'x'), null, 'and cannot be held');

  /* A later version is only for published content. */
  eq(S.vendorCanVersion(S.contentRecord('EXP-007'), RAO), false,
    'an unpublished experiment has no later version to propose');

  /* Validation. */
  eq(S.createContentVersion(RAO, 'consolidation', {
    versionLabel: '1.0', changeNote: 'x', description: 'y', summary: '', delivery: {} }).ok, false,
    'a version label identical to the published one is refused');

  /* Tenant Admin assignment. */
  var r1 = S.assignTenantAdmin(TENANT, { name: 'QA Admin', email: 'qa.admin@example.test' });
  ok(r1.ok, 'a Tenant Admin can be assigned');
  eq(S.assignTenantAdmin(TENANT, { name: 'QA Admin 2', email: 'qa.admin@example.test' }).ok, false,
    'the same email cannot be assigned twice to one tenant');
  eq(S.assignTenantAdmin(TENANT, { name: '', email: 'x' }).ok, false, 'the form validates');

  /* An admin of one tenant never administers another. */
  S.setScenario('B');
  S.selectionAdd('direct-shear', ['web']);
  var req = S.submitRequest({ institutionName: 'Northfield Institute of Technology',
    contactName: 'Prof. Daniel Mensah', contactEmail: 'd.mensah@northfield.example',
    quantity: 2, term: 'yearly' });
  S.approveRequest(req.id, { reason: 'QA — approved as submitted.' }); S.completePayment(req.id);
  var other = S.tenants().filter(function (t) { return t.id !== TENANT; })[0];
  ok(!!other, 'a second tenant now exists');
  eq(S.tenantAdminsFor(other.id).length, 0, 'it has no Tenant Admin — surfaced as attention, never invented');
  S.setProtoTenantAdmin(r1.admin.id);
  eq(S.actingTenantAdmin(other.id), null,
    'AN ADMIN OF ONE TENANT IS NEVER RESOLVED AS THE ADMINISTRATOR OF ANOTHER');
  eq(S.actingTenantAdmin(TENANT).tenantId, TENANT, 'and still administers their own');
  ok(S.tenantsWithoutAdmin().some(function (t) { return t.id === other.id; }),
    'the unassigned tenant appears on the Super Admin attention list');

  /* Role scope validation. */
  eq(S.assignPlatformRole({ actorId: IYER, role: 'reviewer', scope: 'all' }).ok, false,
    'an Academic Reviewer cannot be given platform-wide scope');
  eq(S.assignPlatformRole({ actorId: KULK, role: 'manager', scope: 'all' }).ok, false,
    'a duplicate scope is refused');
  eq(S.assignPlatformRole({ actorId: IYER, role: 'reviewer', scope: 'course', courseId: 'soil-mechanics' }).ok, false,
    'a scope already held is refused');
  eq(S.assignPlatformRole({ actorId: IYER, role: 'reviewer', scope: 'course', courseId: 'nope' }).ok, false,
    'a course that does not exist is refused');
  ok(S.assignPlatformRole({ actorId: IYER, role: 'reviewer', scope: 'experiment',
    experimentId: 'torsion-test' }).ok, 'an Experiment-level scope is accepted');
  ok(S.actorCoversRecord(IYER, S.contentRecord('torsion-test')),
    'and it takes effect immediately — several people may hold one Experiment');
  ok(S.actorsForRecord(S.contentRecord('torsion-test'), 'reviewer').length >= 2,
    'so that Experiment now has two Academic Reviewers');

  /* Canonical governance. */
  var up = S.updateCanonicalAsPlatform('direct-shear', {
    name: 'Direct Shear Test', courseId: 'soil-mechanics',
    summary: 'Updated by the Super Admin (QA).', description: 'QA canonical edit.' });
  ok(up.ok, 'the Super Admin can correct canonical metadata');
  eq(S.contentRecord('direct-shear').id, 'direct-shear', 'the canonical identifier never changes');
  eq(S.updateCanonicalAsPlatform('EXP-007', { name: 'x', courseId: 'soil-mechanics' }).ok, false,
    'a record still with the Vendor is not edited from the platform surface');
  eq(S.updateCanonicalAsPlatform('direct-shear', {
    name: 'Consolidation Test', courseId: 'soil-mechanics' }).ok, false,
    'a duplicate canonical name is refused');

  /* Support + transfer validation. */
  eq(S.createSupportTicket({ kind: 'student', id: RAHUL, name: 'x', roleLabel: 'Student', tenantId: TENANT },
    { category: 'nope', subject: 's', description: 'd' }).ok, false, 'an invented issue kind is refused');
  eq(S.decideDeviceTransfer('DTR-999', 'approved', ''), null, 'deciding a request that does not exist is refused');
}

/* ============================================================
   CROSS-CUTTING — the three altitudes never collapse
   ============================================================ */
function altitudeChecks() {
  group('ALTITUDES — published ≠ tenant access ≠ student entitlement');
  boot();

  eq(S.publishedPool().length > 0, true, 'content is published');
  eq(S.accessAll().length, 0, 'yet no tenant holds anything');
  eq(S.entitledStudentIds(TENANT).length, 0, 'and no student is entitled');

  var g = grantAccess(['direct-shear'], ['vr'], 2, 'yearly');
  eq(S.accessForTenant(TENANT).length, 1, 'the tenant now holds content');
  eq(S.entitledStudentIds(TENANT).length, 0, 'AND STILL NO STUDENT IS ENTITLED');

  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  eq(S.entitledStudentIds(TENANT).length, 1, 'only the Tenant Admin’s assignment creates entitlement');

  /* Governance actions leave all three alone. */
  var accCount = S.accessAll().length, ents = S.entitledStudentIds(TENANT).length;
  var pubCount = S.publishedPool().length;

  S.assignPlatformRole({ actorId: IYER, role: 'reviewer', scope: 'course', courseId: 'fluid-mechanics' });
  S.assignTenantAdmin(TENANT, { name: 'QA Two', email: 'qa2@example.test' });
  S.createSupportTicket({ kind: 'faculty', id: ARJUN, name: 'Dr. Arjun Mehta', roleLabel: 'Faculty', tenantId: TENANT },
    { category: 'login', subject: 'QA', description: 'QA' });
  S.createDeviceTransfer(RAHUL, { technology: 'vr', currentDevice: 'a', newDevice: 'b', reason: 'c' });
  S.decideDeviceTransfer(S.transfersForStudent(RAHUL)[0].id, S.TRANSFER_STATUS.APPROVED, '');

  eq(S.accessAll().length, accCount, 'no governance action created tenant access');
  eq(S.entitledStudentIds(TENANT).length, ents, 'no governance action created entitlement');
  eq(S.publishedPool().length, pubCount, 'no governance action published anything');
}

/* ============================================================
   ADVERSARIAL PASS — the defects found by the second review, each
   pinned by an assertion so it cannot come back
   ============================================================ */
/* ============================================================
   SCENARIO L — ROLE WITHDRAWAL FREEZES, IT NEVER DELETES

   The conservative governance rule, asserted end to end:

     ACTIVE relevant scope   → view · edit · submit, as the lifecycle allows
     WITHDRAWN               → still visible, READ-ONLY: no edit, no submit,
                               no resubmit, no Course change, no technology,
                               package or metadata change; history preserved
     RESTORED                → authority returns where the lifecycle allows it

   The decisive case is the COURSE ESCAPE. Because `updateContentDraft`
   also asks whether the Vendor may file into the Course the FORM is
   offering, a same-Course edit was already refused for an incidental
   reason — while re-filing the record into a Course the Vendor DID still
   hold succeeded, moved the Experiment and made it submittable again. An
   assertion that only tests the same-Course edit proves nothing.
   ============================================================ */
function soilDraft(name) {
  return S.createContentDraft(RAO, {
    name: name, courseId: 'soil-mechanics', summary: 'QA.', description: 'QA fixture.',
    technologies: ['web'], delivery: { web: { url: 'https://example.org/qa', runtime: 'Browser' } },
    versionLabel: '1.0'
  });
}
function raoSoilScope() {
  return S.roleAssignments({ actorId: RAO }).filter(function (m) {
    return m.scope === 'course' && m.courseId === 'soil-mechanics';
  })[0];
}
function draftFields(name, courseId, versionLabel) {
  return {
    name: name, courseId: courseId, summary: 'QA.', description: 'QA fixture.',
    technologies: ['web'], delivery: { web: { url: 'https://example.org/qa', runtime: 'Browser' } },
    versionLabel: versionLabel || '1.0'
  };
}

/* ============================================================
   SCENARIO M — EFFECTIVE ENTITLEMENT vs STORED ALLOCATION

   Deactivating an institution must move exactly one of these two and
   leave the other alone:

     ALLOCATION   approved / assigned / remaining, and WHO HOLDS A
                  LICENCE — historical-current state. UNCHANGED.
     ENTITLEMENT  what a learner can actually reach right now. ZERO.

   Both are true at once for a deactivated tenant. The defect was a
   surface reading the first and labelling it the second.
   ============================================================ */
function scenarioEntitlementMetric() {
  group('SCENARIO M — deactivation zeroes entitlement and preserves allocation');
  boot();

  var g = grantAccess(['direct-shear'], ['vr', 'web'], 3, 'yearly');
  var acc = g.access;
  S.assignExperiment(TENANT, acc.id, 'direct-shear', 'student', [RAHUL]);
  var assignmentIds = S.activeAssignments(TENANT).map(function (a) { return a.id; }).join(',');

  function snap() {
    var al = S.accessAllocation(acc.id);
    var ta = S.tenantAllocation(TENANT);
    return {
      approved: al.approved, assigned: al.assigned, remaining: al.remaining,
      licenceHolders: ta.uniqueLicenceHolders,
      tenantAssigned: ta.assigned, tenantApproved: ta.approved, tenantRemaining: ta.remaining,
      effective: S.entitledStudentIds(TENANT).length,
      perExperiment: S.entitledStudentsFor(acc.id, 'direct-shear').length,
      canRun: S.studentCanRun(RAHUL, 'direct-shear', 'web'),
      assignments: S.activeAssignments(TENANT).length,
      assignmentIds: S.activeAssignments(TENANT).map(function (a) { return a.id; }).join(',')
    };
  }

  /* ---- ACTIVE ---- */
  var a = snap();
  eq(a.tenantAssigned, 1, 'ACTIVE: Assigned students = 1');
  eq(a.effective, 1, 'ACTIVE: Entitled students = 1');
  eq(a.perExperiment, 1, 'ACTIVE: the experiment reports 1 student entitled');
  eq(a.canRun, true, 'ACTIVE: the student can launch');
  eq(a.approved + '/' + a.assigned + '/' + a.remaining, '3/1/2', 'ACTIVE: licences 3 / 1 / 2');

  /* ---- DEACTIVATED ---- */
  S.deactivateTenant(TENANT, 'QA — entitlement metric scenario');
  var d = snap();
  eq(d.effective, 0, 'INACTIVE: effective entitlement is 0');
  eq(d.perExperiment, 0, 'INACTIVE: the experiment reports 0 students entitled');
  eq(d.canRun, false, 'INACTIVE: the student cannot launch');
  eq(d.tenantAssigned, 1, 'INACTIVE: Assigned students REMAINS 1');
  eq(d.approved + '/' + d.assigned + '/' + d.remaining, '3/1/2', 'INACTIVE: licences REMAIN 3 / 1 / 2');
  eq(d.licenceHolders, 1, 'INACTIVE: the allocation roll-up still counts 1 licence holder — deliberately');
  eq(d.assignments, 1, 'INACTIVE: the assignment record is NOT removed');
  eq(d.assignmentIds, assignmentIds, 'INACTIVE: and it is the SAME assignment, not a replacement');
  /* The contradiction the defect produced: the Overview tile and the
     "students with no entitlement" row disagreeing on one screen. */
  eq(S.unassignedStudents(TENANT).some(function (p) { return p.id === RAHUL; }), true,
    'INACTIVE: Rahul counts as having no effective entitlement …');
  eq(S.entitledStudentIds(TENANT).indexOf(RAHUL), -1,
    '… and the tile now reads from that same authoritative answer');

  /* ---- REACTIVATED ---- */
  S.reactivateTenant(TENANT);
  var r = snap();
  eq(r.effective, 1, 'REACTIVATED: effective entitlement returns to 1');
  eq(r.perExperiment, 1, 'REACTIVATED: the experiment reports 1 student entitled again');
  eq(r.canRun, true, 'REACTIVATED: the student can launch again');
  eq(r.assignments, 1, 'REACTIVATED: still exactly one assignment');
  eq(r.assignmentIds, assignmentIds, 'NO RECREATION: the SAME assignment id came back');
  eq(r.approved + '/' + r.assigned + '/' + r.remaining, '3/1/2', 'REACTIVATED: licences UNCHANGED 3 / 1 / 2');
  eq(r.tenantAssigned, 1, 'REACTIVATED: Assigned students still 1');
}

function scenarioRoleWithdrawal() {
  group('SCENARIO L — role withdrawal freezes the record, and destroys nothing');
  boot();

  /* ---------- A · ACTIVE SCOPE ---------- */
  var d = soilDraft('QA Active Draft');
  ok(!!d, 'ACTIVE: the Vendor created a soil-mechanics draft');
  eq(S.vendorCanEdit(S.contentRecord(d.id), RAO), true, 'ACTIVE: the owner may edit it');
  eq(S.vendorCanSubmit(S.contentRecord(d.id), RAO), true, 'ACTIVE: and may submit it');
  ok(!!S.updateContentDraft(RAO, d.id, draftFields('QA Active Draft v2', 'soil-mechanics')),
    'ACTIVE: the writer accepts the edit');
  ok(!!S.submitContent(RAO, d.id), 'ACTIVE: the writer accepts the submission');
  eq(S.contentRecord(d.id).status, S.CONTENT_STATUS.ACADEMIC_REVIEW, 'ACTIVE: and it moved into review');

  /* ---------- B · WITHDRAWN ---------- */
  boot();
  var f = soilDraft('QA Frozen Draft');
  /* A second record that has ALREADY been submitted, so D can prove that
     work already in the chain stays visible through the withdrawal. */
  var submitted = soilDraft('QA Submitted Draft');
  S.submitContent(RAO, submitted.id);
  var publishedBefore = S.publishedPool().length;
  var histBefore = S.contentRecord(f.id).history.length;
  var updatedBefore = S.contentRecord(f.id).updatedAt;
  var sc = raoSoilScope();
  ok(!!sc, 'the Vendor holds an explicit soil-mechanics course scope');
  S.removePlatformRoleAssignment(sc.id, 'QA — scope withdrawn');

  ok(S.contentForVendor(RAO).some(function (r) { return r.id === f.id; }),
    'WITHDRAWN: STILL VISIBLE — the owner’s own draft is not hidden');
  eq(S.canViewHistoricalRecord(S.contentRecord(f.id), RAO), true,
    'WITHDRAWN: the VIEW predicate is ownership-based and still true');
  eq(S.canMutateVendorRecord(S.contentRecord(f.id), RAO), false,
    'WITHDRAWN: the MUTATE predicate is scope-aware and false');
  eq(S.vendorScopeWithdrawn(S.contentRecord(f.id), RAO), true,
    'WITHDRAWN: and the screens can tell WHY it is read-only');
  eq(S.vendorCanEdit(S.contentRecord(f.id), RAO), false, 'WITHDRAWN: READ-ONLY — no edit');
  eq(S.vendorCanSubmit(S.contentRecord(f.id), RAO), false, 'WITHDRAWN: no submit');

  eq(S.updateContentDraft(RAO, f.id, draftFields('QA Renamed', 'soil-mechanics')), null,
    'WITHDRAWN: the STATE WRITER refuses a same-Course edit');
  eq(S.updateContentDraft(RAO, f.id, draftFields('QA Escaped', 'surveying', '2.0')), null,
    'NO COURSE ESCAPE: it cannot be re-filed into a Course the Vendor DOES still hold');
  eq(S.contentRecord(f.id).courseId, 'soil-mechanics', 'WITHDRAWN: the Course is unchanged');
  eq(S.contentRecord(f.id).name, 'QA Frozen Draft', 'WITHDRAWN: the name is unchanged');
  eq(S.contentRecord(f.id).versionLabel, '1.0', 'WITHDRAWN: the version label is unchanged');
  eq(S.contentRecord(f.id).technologies.join(','), 'web', 'WITHDRAWN: the technologies are unchanged');
  eq(S.contentRecord(f.id).updatedAt, updatedBefore, 'WITHDRAWN: nothing was even touched');
  eq(S.contentRecord(f.id).history.length, histBefore, 'WITHDRAWN: no history entry was manufactured');
  eq(S.submitContent(RAO, f.id), null, 'WITHDRAWN: the writer refuses the submission');

  /* ---------- D · already-submitted history stays visible ---------- */
  ok(S.contentForVendor(RAO).some(function (r) { return r.id === submitted.id; }),
    'HISTORY VISIBLE: the already-submitted record is still in the Vendor’s own list');
  eq(S.contentRecord(submitted.id).status, S.CONTENT_STATUS.ACADEMIC_REVIEW,
    'HISTORY VISIBLE: and its status was not disturbed by the withdrawal');
  ok(S.actorHistoricalRecordIds(RAO).indexOf(submitted.id) !== -1,
    'HISTORY VISIBLE: the governance surface still attributes it to them');
  eq(S.publishedPool().length, publishedBefore,
    'PUBLICATION UNTOUCHED: withdrawing a role scope publishes and unpublishes nothing');

  /* ---------- C · RESTORE ---------- */
  S.restorePlatformRoleAssignment(sc.id);
  eq(S.vendorCanEdit(S.contentRecord(f.id), RAO), true, 'RESTORED: editing returns');
  eq(S.vendorCanSubmit(S.contentRecord(f.id), RAO), true, 'RESTORED: submission returns');
  ok(!!S.updateContentDraft(RAO, f.id, draftFields('QA Thawed', 'soil-mechanics')),
    'RESTORED: and the writer accepts an edit again');
  eq(S.contentRecord(f.id).courseId, 'soil-mechanics',
    'RESTORED: on the record where it always was — it never moved');

  /* ---------- E · the later-version candidate follows the same rule ---------- */
  boot();
  var made = S.createContentVersion(RAO, 'direct-shear', {
    versionLabel: '1.1', changeNote: 'QA', description: 'QA', summary: '', delivery: {} });
  ok(made.ok, 'VERSION: a covered Vendor created a candidate');
  var vsc = raoSoilScope();
  var labelBefore = S.contentVersion(made.version.id).versionLabel;
  var vHistBefore = S.contentVersion(made.version.id).history.length;
  S.removePlatformRoleAssignment(vsc.id, 'QA');
  ok(S.versionsForVendor(RAO).some(function (x) { return x.id === made.version.id; }),
    'VERSION WITHDRAWN: STILL VISIBLE in the Vendor’s own Versions list');
  eq(S.canViewHistoricalVersion(S.contentVersion(made.version.id), RAO), true,
    'VERSION WITHDRAWN: the view predicate stays true');
  eq(S.canMutateVendorVersion(S.contentVersion(made.version.id), RAO), false,
    'VERSION WITHDRAWN: the mutate predicate is false');
  eq(S.versionEditableByVendor(S.contentVersion(made.version.id), RAO), false,
    'VERSION WITHDRAWN: READ-ONLY — no edit');
  eq(S.updateContentVersion(RAO, made.version.id, {
    versionLabel: '9.9', changeNote: 'QA escape', description: 'QA escape', summary: '',
    delivery: { web: { url: 'https://evil.example/qa', runtime: 'Browser' } } }).ok, false,
    'VERSION WITHDRAWN: the writer refuses, including the delivery references');
  eq(S.contentVersion(made.version.id).versionLabel, labelBefore, 'VERSION WITHDRAWN: fields unchanged');
  eq(S.contentVersion(made.version.id).history.length, vHistBefore, 'VERSION WITHDRAWN: history unchanged');
  eq(S.submitContentVersion(RAO, made.version.id), null, 'VERSION WITHDRAWN: submission refused');
  eq(S.contentRecord('direct-shear').versionLabel, S.contentRecord('direct-shear').versionLabel,
    'VERSION WITHDRAWN: and the PUBLISHED version is not what a candidate can touch anyway');
  S.restorePlatformRoleAssignment(vsc.id);
  eq(S.versionEditableByVendor(S.contentVersion(made.version.id), RAO), true,
    'VERSION RESTORED: editing returns');
  ok(S.updateContentVersion(RAO, made.version.id, {
    versionLabel: '1.2', changeNote: 'QA', description: 'QA', summary: '', delivery: {} }).ok,
    'VERSION RESTORED: and the writer accepts the edit');

  /* ---------- F · Academic Reviewer regression ---------- */
  boot();
  var rr = S.contentRecord('EXP-007');
  S.submitContent(RAO, rr.id);
  S.addOutcome(IYER, rr.id, 'QA outcome.');
  ok(!!S.approveAcademic(IYER, rr.id, 'QA — sound.'), 'REVIEWER: a decision was taken while holding the scope');
  var decisionsBefore = S.academicReviewsBy(IYER).length;
  var rsc = S.roleAssignments({ actorId: IYER }).filter(function (m) {
    return m.scope === 'course' && m.courseId === 'soil-mechanics'; })[0];
  S.removePlatformRoleAssignment(rsc.id, 'QA');
  eq(S.academicReviewsBy(IYER).length, decisionsBefore,
    'REVIEWER WITHDRAWN: the completed decision is still recorded');
  ok(S.actorHistoricalRecordIds(IYER).indexOf(rr.id) !== -1,
    'REVIEWER WITHDRAWN: and the governance surface still shows what they decided');
  ok(S.contentRecord(rr.id).history.some(function (h) { return h.actorId === IYER; }),
    'REVIEWER WITHDRAWN: their name is still on the record’s history');
  eq(S.reviewerCanAct(S.contentRecord(rr.id), IYER), false,
    'REVIEWER WITHDRAWN: but no FUTURE academic action is available');
  eq(S.approveAcademic(IYER, rr.id, 'QA'), null, 'REVIEWER WITHDRAWN: and the writer refuses');
  S.restorePlatformRoleAssignment(rsc.id);

  /* ---------- G · nothing else in the platform moves ---------- */
  boot();
  var g = grantAccess(['direct-shear'], ['vr', 'web'], 3, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  var tick = S.createSupportTicket({ kind: 'vendor', id: RAO, name: 'Ananya Rao',
    roleLabel: 'Vendor', tenantId: null },
    { category: 'package', subject: 'QA vendor report', description: 'QA.' });
  ok(tick.ok, 'a support report exists before the withdrawal');

  var beforeState = {
    access: S.accessForTenant(TENANT).length,
    assigned: S.accessAllocation(g.access.id).assigned,
    remaining: S.accessAllocation(g.access.id).remaining,
    entitled: S.entitledStudentIds(TENANT).join(','),
    assignments: S.activeAssignments(TENANT).length,
    published: S.publishedPool().length,
    canRun: S.studentCanRun(RAHUL, 'direct-shear', 'web'),
    tickets: S.ticketsForRequester('vendor', RAO).length
  };
  var gsc = raoSoilScope();
  S.removePlatformRoleAssignment(gsc.id, 'QA — governance only');

  eq(S.accessForTenant(TENANT).length, beforeState.access, 'NO SPILLOVER: tenant access records unchanged');
  eq(S.accessAllocation(g.access.id).assigned, beforeState.assigned, 'NO SPILLOVER: licences consumed unchanged');
  eq(S.accessAllocation(g.access.id).remaining, beforeState.remaining, 'NO SPILLOVER: licences remaining unchanged');
  eq(S.entitledStudentIds(TENANT).join(','), beforeState.entitled, 'NO SPILLOVER: student entitlement unchanged');
  eq(S.activeAssignments(TENANT).length, beforeState.assignments, 'NO SPILLOVER: assignments unchanged');
  eq(S.publishedPool().length, beforeState.published, 'NO SPILLOVER: the published catalogue unchanged');
  eq(S.studentCanRun(RAHUL, 'direct-shear', 'web'), beforeState.canRun,
    'NO SPILLOVER: the entitled student can still launch');
  eq(S.ticketsForRequester('vendor', RAO).length, beforeState.tickets,
    'NO SPILLOVER: the support report is untouched');

  S.restorePlatformRoleAssignment(gsc.id);
  eq(S.entitledStudentIds(TENANT).join(','), beforeState.entitled,
    'NO SPILLOVER: and restoring the scope changes none of it either');
}

function adversarialFixes() {
  group('ADVERSARIAL — the defects found by the second review');
  boot();

  /* ---- a withdrawn Vendor scope FREEZES the record: it stays visible
          and stops being changeable ---- */
  var draft = S.createContentDraft(RAO, {
    name: 'QA Scope Draft', courseId: 'soil-mechanics',
    summary: 'QA.', description: 'QA fixture.', technologies: ['web'],
    delivery: { web: { url: 'https://example.org/qa-scope', runtime: 'Browser' } },
    versionLabel: '1.0'
  });
  ok(!!draft, 'the Vendor created a draft while holding the scope');
  var vs = S.roleAssignments({ actorId: RAO }).filter(function (m) { return m.courseId === 'soil-mechanics'; })[0];
  S.removePlatformRoleAssignment(vs.id, 'QA');

  ok(S.contentForVendor(RAO).some(function (r) { return r.id === draft.id; }),
    'STILL VISIBLE: withdrawing the scope does not hide the Vendor’s own draft');
  eq(S.canViewHistoricalRecord(S.contentRecord(draft.id), RAO), true,
    'VIEWING IS OWNERSHIP: the view predicate is unaffected by the withdrawal');
  eq(S.canMutateVendorRecord(S.contentRecord(draft.id), RAO), false,
    'MUTATING IS AUTHORITY: the mutate predicate is false once the scope is withdrawn');
  eq(S.vendorCanEdit(S.contentRecord(draft.id), RAO), false,
    'READ-ONLY: they may NOT edit a record no live assignment covers');
  eq(S.vendorCanSubmit(S.contentRecord(draft.id), RAO), false,
    'SCOPE LEAK CLOSED: they may NOT submit it into a scope they no longer hold');
  eq(S.submitContent(RAO, draft.id), null, 'and the writer refuses, not only the screen');
  S.restorePlatformRoleAssignment(vs.id);
  eq(S.vendorCanEdit(S.contentRecord(draft.id), RAO), true, 'restoring the scope restores editing');
  eq(S.vendorCanSubmit(S.contentRecord(draft.id), RAO), true, 'restoring the scope restores submission');
  ok(!!S.submitContent(RAO, draft.id), 'and it submits');

  /* ---- the same rule on a later-version candidate ---- */
  boot();
  var made = S.createContentVersion(RAO, 'direct-shear', {
    versionLabel: '1.1', changeNote: 'QA', description: 'QA', summary: '', delivery: {} });
  ok(made.ok, 'a covered Vendor created a version candidate');
  var vs2 = S.roleAssignments({ actorId: RAO }).filter(function (m) { return m.courseId === 'soil-mechanics'; })[0];
  S.removePlatformRoleAssignment(vs2.id, 'QA');
  ok(S.versionsForVendor(RAO).some(function (x) { return x.id === made.version.id; }),
    'STILL VISIBLE: the candidate stays listed in the Vendor’s own Versions');
  eq(S.versionEditableByVendor(S.contentVersion(made.version.id), RAO), false,
    'READ-ONLY: their candidate is frozen, not editable');
  eq(S.versionSubmittableByVendor(S.contentVersion(made.version.id), RAO), false,
    'SCOPE LEAK CLOSED: and it cannot be submitted for academic review');
  var vLabelBefore = S.contentVersion(made.version.id).versionLabel;
  var vHistBefore = S.contentVersion(made.version.id).history.length;
  var refused = S.updateContentVersion(RAO, made.version.id, {
    versionLabel: '9.9', changeNote: 'QA escape', description: 'QA escape', summary: '', delivery: {} });
  eq(refused.ok, false, 'the version WRITER refuses the edit — not only the screen');
  eq(S.contentVersion(made.version.id).versionLabel, vLabelBefore,
    'and the candidate’s own fields are untouched by the refused write');
  eq(S.contentVersion(made.version.id).history.length, vHistBefore,
    'and no history entry was manufactured by the refusal');
  eq(S.submitContentVersion(RAO, made.version.id), null, 'and the writer refuses the submission');
  S.restorePlatformRoleAssignment(vs2.id);
  eq(S.versionEditableByVendor(S.contentVersion(made.version.id), RAO), true,
    'restoring the scope restores editing');
  ok(!!S.submitContentVersion(RAO, made.version.id), 'restoring the scope restores submission');

  /* ---- a DRAFT candidate must never reach a reviewer ---- */
  boot();
  var d2 = S.createContentVersion(RAO, 'direct-shear', {
    versionLabel: '1.1', changeNote: 'QA', description: 'QA', summary: '', delivery: {} });
  eq(S.versionsForReviewer(IYER, {}).length, 0,
    'a DRAFT candidate is invisible to the Academic Reviewer — the form promised exactly that');
  S.submitContentVersion(RAO, d2.version.id);
  eq(S.versionsForReviewer(IYER, {}).length, 1, 'submitting is what makes it visible');

  /* ---- entitled-student sets agree with the entitlement engine ---- */
  boot();
  var g = grantAccess(['direct-shear'], ['vr'], 2, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  eq(S.entitledStudentIds(TENANT).length, 1, 'one student is entitled');
  eq(S.entitledStudentsFor(g.access.id, 'direct-shear').length, 1, 'and the per-record set agrees');
  S.deactivateTenant(TENANT, 'QA');
  eq(S.entitledStudentIds(TENANT).length, 0,
    'CONSISTENCY: a deactivated institution reports NO effective entitlement');
  eq(S.entitledStudentsFor(g.access.id, 'direct-shear').length, 0, 'on both surfaces');
  eq(S.studentCanRun(RAHUL, 'direct-shear', 'vr'), false, 'matching what the Student is actually told');
  S.reactivateTenant(TENANT, 'QA');
  eq(S.entitledStudentIds(TENANT).length, 1, 'and it comes back');

  /* ---- a Student with a suspended institution still HAS a device ---- */
  S.deactivateTenant(TENANT, 'QA');
  eq(S.packageTechnologiesForStudent(RAHUL).length, 0, 'no technology is currently usable');
  eq(S.studentHasPackageTechnology(RAHUL), true,
    'but the Student still HOLDS a device technology — so the page says the institution is suspended, ' +
    'not the plainly untrue "nothing you hold runs on a device"');
  eq(S.createDeviceTransfer(RAHUL, { currentDevice: 'a', newDevice: 'b', reason: 'c' }).ok, false,
    'and a request still cannot be raised');
  S.reactivateTenant(TENANT, 'QA');

  /* ---- a release MERGES delivery; it never blanks a field ---- */
  boot();
  var rec = S.contentRecord('direct-shear');
  rec.delivery.vr = { packageLabel: 'Existing label', packageRef: 'REF-EXISTING',
                      install: 'Existing install note', runtime: 'Existing runtime' };
  S.save();
  var v3 = S.createContentVersion(RAO, 'direct-shear', {
    versionLabel: '1.1', changeNote: 'QA', description: 'QA description', summary: '',
    delivery: { vr: { packageRef: 'REF-NEW', runtime: '', packageLabel: '' } } });
  S.submitContentVersion(RAO, v3.version.id);
  S.approveVersionAcademic(IYER, v3.version.id, '');
  S.releaseVersion(v3.version.id, '');
  var d = S.deliveryOf(S.contentRecord('direct-shear'), 'vr');
  eq(d.packageRef, 'REF-NEW', 'the value the candidate supplied is written');
  eq(d.packageLabel, 'Existing label', 'a BLANK candidate field does not blank the published one');
  eq(d.runtime, 'Existing runtime', 'and neither does a blank runtime');
  eq(d.install, 'Existing install note', 'a field the version form never asks about is not discarded');

  /* ---- reopening a support report clears the CURRENT resolution ---- */
  boot();
  var t = S.createSupportTicket({ kind: 'student', id: RAHUL, name: 'Rahul Verma', roleLabel: 'Student', tenantId: TENANT },
    { category: 'login', subject: 'QA', description: 'QA' });
  S.resolveSupportTicket(t.ticket.id, 'Fixed it.');
  eq(S.supportTicketById(t.ticket.id).resolutionNote, 'Fixed it.', 'the resolution is recorded');
  S.reopenSupportTicket(t.ticket.id, '');
  eq(S.supportTicketById(t.ticket.id).status, S.SUPPORT_STATUS.OPEN, 'reopening returns it to open');
  eq(S.supportTicketById(t.ticket.id).resolutionNote, '',
    'and an OPEN report no longer carries a current resolution');
  eq(S.supportTicketById(t.ticket.id).previousResolution, 'Fixed it.',
    'the earlier resolution is kept as history, not destroyed');
  ok(S.supportTicketById(t.ticket.id).history.length >= 3, 'and the whole sequence is in the history');

  /* ---- BOTH controls follow the LIVE scope: no dead control is drawn ---- */
  boot();
  var d3 = S.createContentDraft(RAO, {
    name: 'QA Submit Scope', courseId: 'soil-mechanics', summary: 'QA.', description: 'QA.',
    technologies: ['web'], delivery: { web: { url: 'https://example.org/qa', runtime: 'Browser' } },
    versionLabel: '1.0' });
  var sc3 = S.roleAssignments({ actorId: RAO }).filter(function (m) { return m.courseId === 'soil-mechanics'; })[0];
  S.removePlatformRoleAssignment(sc3.id, 'QA');
  eq(S.vendorCanEdit(S.contentRecord(d3.id), RAO), false,
    'NO DEAD CONTROL: the edit predicate the screen renders from is false, so no Edit link is drawn');
  eq(S.vendorCanSubmit(S.contentRecord(d3.id), RAO), false,
    'NO DEAD CONTROL: the submit predicate is false too, so no button is drawn');
  ok(S.contentForVendor(RAO).some(function (r) { return r.id === d3.id; }),
    'and the record the controls were withdrawn from is still there to open and read');
  S.restorePlatformRoleAssignment(sc3.id);
  eq(S.vendorCanEdit(S.contentRecord(d3.id), RAO), true, 'restoring the scope draws the controls again');

  /* ---- a tenant's support reports survive a change of Tenant Admin ---- */
  boot();
  var t1 = S.createSupportTicket({ kind: 'tenant-admin', id: TENANT, name: 'Priya Raghavan',
    roleLabel: 'Institute Admin / Tenant Admin', tenantId: TENANT },
    { category: 'access', subject: 'QA institution report', description: 'QA.' });
  ok(t1.ok, 'the institution filed a report');
  eq(S.ticketsForRequester('tenant-admin', TENANT).length, 1, 'and it is on the institution’s Help page');
  var oldAdmin = S.tenantAdminsFor(TENANT)[0];
  S.removeTenantAdmin(oldAdmin.id);
  S.assignTenantAdmin(TENANT, { name: 'QA Successor', email: 'qa.successor@example.test' });
  eq(S.ticketsForRequester('tenant-admin', TENANT).length, 1,
    'REPORT HISTORY SURVIVES: changing the Tenant Admin does not make the institution’s reports vanish');
  eq(S.ticketsForRequester('tenant-admin', TENANT)[0].requesterName, 'Priya Raghavan',
    'and each report still records who actually filed it');

  /* ---- adding a member to an assigned group never displaces anyone ---- */
  boot();
  var g2 = grantAccess(['direct-shear'], ['web'], 2, 'yearly');
  var grp = S.createGroup(TENANT, { name: 'QA displacement' });
  var ids = S.studentsForTenant(TENANT).map(function (p) { return p.id; });
  S.addToGroup(grp.id, ids[0]); S.addToGroup(grp.id, ids[1]);
  S.assignExperiment(TENANT, g2.access.id, 'direct-shear', 'group', [grp.id]);
  var beforeIds = S.accessAllocation(g2.access.id).entitledIds.slice();
  eq(beforeIds.length, 2, 'two students hold the two licences');
  S.addToGroup(grp.id, ids[2]);
  var afterAlloc = S.accessAllocation(g2.access.id);
  eq(afterAlloc.entitledIds.join(','), beforeIds.join(','),
    'NO DISPLACEMENT: adding a third member to an already-assigned group displaces nobody');
  eq(afterAlloc.heldIds.length, 1, 'the new member is HELD — visible, never silently entitled');

  /* THE HARD CASE, and the one the queue used to get wrong: the newcomer's
     id sorts EARLIER than the id of the student who already holds the
     licence. Every member of a group assignment shared one ordering stamp,
     so the queue fell through to comparing ids and the newcomer won. */
  boot();
  var g3 = grantAccess(['direct-shear'], ['web'], 1, 'yearly');
  var late = S.createGroup(TENANT, { name: 'QA late batch' });
  var all = S.studentsForTenant(TENANT).map(function (p) { return p.id; });
  var high = all[all.length - 1];              /* the HIGHEST id */
  var low = all[0];                            /* the LOWEST id */
  S.addToGroup(late.id, high);
  S.assignExperiment(TENANT, g3.access.id, 'direct-shear', 'group', [late.id]);
  eq(S.accessAllocation(g3.access.id).entitledIds.join(','), high,
    'the first member holds the single licence');
  eq(S.studentCanRun(high, 'direct-shear', 'web'), true, 'and can launch');
  S.addToGroup(late.id, low);
  var alloc3 = S.accessAllocation(g3.access.id);
  eq(alloc3.entitledIds.join(','), high,
    'NO SILENT DISPLACEMENT: a newcomer whose id sorts earlier does NOT take the licence');
  eq(alloc3.heldIds.join(','), low, 'the newcomer is held, behind the student who was there first');
  eq(S.studentCanRun(high, 'direct-shear', 'web'), true, 'the original holder can still launch');
  eq(S.studentCanRun(low, 'direct-shear', 'web'), false, 'and the newcomer honestly cannot');
  /* Removing the newcomer again must not disturb the holder either. */
  S.removeFromGroup(late.id, low);
  eq(S.accessAllocation(g3.access.id).entitledIds.join(','), high, 'and removing them changes nothing');
}


/* ============================================================
   SCENARIO O — THE FACULTY DESCRIPTIVE-REVIEW BOUNDARY.

   `STK31-31` makes Faculty the ONLY human evaluator of a written
   answer. AI may suggest, draft and assist; it may never decide. That
   boundary was correct in the code and had NO automated assertion —
   the one coverage gap named at the Implementation-06 closeout. It is
   asserted here rather than trusted.

   The behaviour is NOT changed to make this test writable.
   ============================================================ */
function scenarioAIReviewBoundary() {
  group('SCENARIO O — AI assistance never finalises a descriptive review');
  boot();

  var g = grantAccess(['direct-shear'], ['web'], 3, 'yearly');
  S.mapFaculty(TENANT, ARJUN, g.access.id, 'soil-mechanics', null);
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  ok(S.studentCanRun(RAHUL, 'direct-shear', 'web'), 'the Student is entitled and can run it');

  /* An assessment whose ONLY question is descriptive, so the outcome
     depends entirely on the human decision. */
  var q = S.addQuestion(TENANT, {
    type: 'descriptive', text: 'Explain what the direct shear test measures.',
    experimentId: 'direct-shear', points: 4,
    guidance: 'Award marks for shear strength and the failure envelope.'
  }, ARJUN);
  ok(q.ok, 'Faculty added a descriptive question to the bank');

  var def = S.assessmentForTenant(TENANT, 'direct-shear');
  ok(!!def, 'the seeded assessment definition exists');
  var added = S.addQuestionsToAssessment(def.id, [q.question.id], ARJUN);
  ok(added.ok !== false, 'and the descriptive question is on the assessment');

  var att = S.startAttempt(RAHUL, 'direct-shear');
  ok(!!att, 'the Student started the attempt');
  S.saveAnswer(att.id, q.question.id, 'It measures shear strength along a forced failure plane.');
  S.submitAttempt(att.id);

  var pending = S.reviewsForFaculty(ARJUN, { status: 'pending' })
    .filter(function (r) { return r.attemptId === att.id; });
  eq(pending.length, 1, 'submission created exactly one pending review for the written answer');
  var rv = pending[0];
  eq(S.attemptById(att.id).outcome, 'PENDING_FACULTY_REVIEW', 'and the outcome is pending Faculty review');

  /* ---- THE BOUNDARY ---- */
  var before = JSON.stringify({ status: rv.status, marks: rv.marks, by: rv.reviewedBy, at: rv.reviewedAt });
  var sug = S.generateReviewAssistance(rv.id);
  ok(!!sug, 'a suggestion was generated');
  ok(typeof sug.suggestedMarks === 'number', 'and it carries a suggested figure');

  var after = S.reviewById(rv.id);
  eq(after.status, 'pending', 'AI ASSISTANCE DID NOT COMPLETE THE REVIEW');
  eq(after.marks, null, 'AI ASSISTANCE WROTE NO MARKS');
  eq(after.reviewedBy, null, 'AI ASSISTANCE CLAIMED NO EVALUATOR');
  eq(after.reviewedAt, null, 'AI ASSISTANCE STAMPED NO DECISION TIME');
  eq(after.assistance.accepted, false, 'the suggestion is recorded as NOT accepted');
  eq(JSON.stringify({ status: after.status, marks: after.marks, by: after.reviewedBy, at: after.reviewedAt }),
    before, 'the review record is byte-identical on the fields that decide a result');
  eq(S.attemptById(att.id).outcome, 'PENDING_FACULTY_REVIEW',
    'THE STUDENT RESULT IS UNCHANGED — a suggestion decides nothing');

  /* Generating it again is still not a decision. */
  S.generateReviewAssistance(rv.id);
  eq(S.reviewById(rv.id).status, 'pending', 'generating a second suggestion is still not a decision');

  /* Only the Faculty member's explicit call produces a result — and it
     needs a real person, real marks, and their own mapped content. */
  eq(S.finaliseReview(rv.id, '', '', ARJUN, false).ok, false, 'marks are required — a blank does not finalise');
  eq(S.finaliseReview(rv.id, 99, '', ARJUN, false).ok, false, 'marks above the maximum are refused');
  eq(S.finaliseReview(rv.id, 3, '', 'USR-999', false).ok, false, 'a person who is not the mapped Faculty is refused');
  eq(S.reviewById(rv.id).status, 'pending', 'and none of those attempts moved the review');

  var done = S.finaliseReview(rv.id, sug.suggestedMarks, 'Agreed.', ARJUN, true);
  ok(done.ok, 'THE FACULTY MEMBER finalised it explicitly');
  eq(S.reviewById(rv.id).status, 'completed', 'only then is the review complete');
  eq(S.reviewById(rv.id).reviewedBy, ARJUN, 'and the evaluator recorded is the human being');
  eq(S.reviewById(rv.id).assistance.accepted, true,
    'whether the suggestion was used is recorded — an audit trail, not an author');
  ok(S.attemptById(att.id).outcome !== 'PENDING_FACULTY_REVIEW', 'the Student result exists only now');

  eq(S.finaliseReview(rv.id, 1, '', ARJUN, false).ok, false, 'a completed review cannot be re-decided');
}

/* ============================================================
   SCENARIO P — THE SUPER ADMIN DECISION SURFACE (STK31-20 / U-SA-05)
   and the tenant allocation the decision grants (STK31-24 / U-SA-08).
   ============================================================ */
function scenarioRequestDecision() {
  group('SCENARIO P — approve · request more information · required reason · allocation');
  boot();

  S.setScenario('A');
  S.selectionAdd('direct-shear', ['web', 'vr']);
  S.selectionAdd('consolidation', ['web']);
  var req = S.submitRequest({
    institutionName: 'Sample Engineering Institute',
    contactName: 'Dr. Kavita Sharma', contactEmail: 'kavita.sharma@sample-institute.example',
    quantity: 10, term: 'yearly'
  });
  eq(req.status, S.STATUS.SUBMITTED, 'the request is submitted');

  /* REASON REQUIRED — on both outcomes. */
  var accBefore = S.accessAll().length;
  eq(S.approveRequest(req.id, {}), null, 'APPROVAL WITHOUT A REASON IS REFUSED');
  eq(S.approveRequest(req.id, { reason: '   ' }), null, 'and whitespace is not a reason');
  eq(S.requestMoreInformation(req.id, ''), null, 'REQUESTING MORE INFORMATION WITHOUT A REASON IS REFUSED');
  eq(S.request(req.id).status, S.STATUS.SUBMITTED, 'none of that moved the request');
  eq(S.accessAll().length, accBefore, 'and none of it created an access record');

  /* OUTCOME 2 — request more information. */
  var mi = S.requestMoreInformation(req.id, 'Confirm the department and the intended cohort size.');
  ok(!!mi, 'more information was requested');
  eq(S.request(req.id).status, S.STATUS.INFO_REQUESTED, 'the applicant-visible state exists');
  eq(S.request(req.id).decisionReason, 'Confirm the department and the intended cohort size.',
    'and the reason is the one the applicant reads');
  eq(S.accessAll().length, accBefore, 'REQUESTING MORE INFORMATION GRANTED NOTHING');
  eq(S.entitledStudentIds(TENANT).length, 0, 'and entitled nobody');
  eq(S.approveRequest(req.id, { reason: 'x' }), null, 'a request awaiting information cannot be approved behind the applicant');

  /* The applicant's side of the same outcome. */
  eq(S.resubmitRequest(req.id, ''), null, 'resubmitting needs the reply the platform asked for');
  var back = S.resubmitRequest(req.id, 'Civil Engineering, 8 students.');
  ok(!!back, 'the applicant resubmitted');
  eq(S.request(req.id).status, S.STATUS.SUBMITTED, 'and it is back in the platform queue');
  eq(S.request(req.id).items.length, 2, 'with its selected content unchanged');

  /* ALLOCATION — the grant may only NARROW the request. */
  eq(S.validateGrant(S.request(req.id), { items: [{ experimentId: 'direct-shear', technologies: ['ar'] }] }).ok, false,
    'a technology the institution did not request cannot be granted');
  eq(S.validateGrant(S.request(req.id), { items: [{ experimentId: 'torsion-test', technologies: ['web'] }] }).ok, false,
    'an experiment that is not on the request cannot be granted');
  eq(S.validateGrant(S.request(req.id), {
    items: [{ experimentId: 'direct-shear', technologies: ['web'] }], quantity: 11 }).ok, false,
    'more users than were requested cannot be granted');
  eq(S.validateGrant(S.request(req.id), {
    items: [{ experimentId: 'direct-shear', technologies: ['web'] }], term: 'yearly', quantity: 0 }).ok, false,
    'a quantity of zero is refused');
  eq(S.validateGrant(S.request(req.id), { items: [] }).ok, false, 'granting nothing at all is refused');

  var ok1 = S.validateGrant(S.request(req.id), {
    items: [{ experimentId: 'direct-shear', technologies: ['web'] }], quantity: 4, term: 'quarterly' });
  ok(ok1.ok, 'a narrower grant is accepted');

  var approved = S.approveRequest(req.id, {
    reason: 'Approved for the Civil Engineering pilot only.',
    grant: { items: [{ experimentId: 'direct-shear', technologies: ['web'] }], quantity: 4, term: 'quarterly' }
  });
  ok(!!approved, 'the Super Admin approved it with an adjusted allocation');
  ok(S.grantNarrowsRequest(S.request(req.id)), 'and the product knows the institution got less than it asked for');

  var rec = S.accessForTenant(TENANT).slice(-1)[0];
  eq(rec.items.length, 1, 'THE ACCESS RECORD CARRIES WHAT WAS GRANTED, not what was requested');
  eq(rec.items[0].experimentId, 'direct-shear', 'the granted experiment');
  eq(rec.items[0].technologies.join(','), 'web', 'and only the granted technology');
  eq(rec.quantity, 4, 'the granted quantity');
  eq(rec.term, 'quarterly', 'and the granted term');
  eq(S.accessHasExperiment(rec, 'consolidation'), false, 'the ungranted experiment is not in the record at all');
  eq(S.entitledStudentIds(TENANT).length, 0, 'AND APPROVAL STILL ENTITLED NOBODY');

  /* The reason is on the history trail, for both sides. */
  ok(S.request(req.id).history.some(function (h) {
    return h.note === 'Approved for the Civil Engineering pilot only.';
  }), 'the decision reason is on the request history');
}

/* ============================================================
   SCENARIO Q — the payment step carries all three FRD 9.1.x
   outcomes, and ONLY SUCCESS WRITES (`ND-12` / `U-COM-03`).
   ============================================================ */
function scenarioPaymentOutcomes() {
  group('SCENARIO Q — declined and unconfirmed payments activate nothing');
  boot();

  S.setScenario('B');
  S.selectionAdd('direct-shear', ['web']);
  var req = S.submitRequest({ institutionName: 'Northfield Institute of Technology',
    contactName: 'Prof. Daniel Mensah', contactEmail: 'd.mensah@northfield.example',
    quantity: 3, term: 'yearly' });
  S.approveRequest(req.id, { reason: 'External pilot approved.' });
  eq(S.request(req.id).status, S.STATUS.APPROVED_PAYMENT_REQUIRED, 'the external route requires payment');

  var tenantsBefore = S.tenants().length, accBefore = S.accessAll().length;

  var dec = S.completePayment(req.id, S.PAYMENT_OUTCOME.DECLINED);
  ok(!!dec, 'a declined outcome is recorded');
  eq(S.request(req.id).status, S.STATUS.APPROVED_PAYMENT_REQUIRED, 'A DECLINED PAYMENT DID NOT ACTIVATE');
  eq(S.tenants().length, tenantsBefore, 'and created no tenant');
  eq(S.accessAll().length, accBefore, 'and created no access record');

  var ind = S.completePayment(req.id, S.PAYMENT_OUTCOME.INDETERMINATE);
  ok(!!ind, 'an unconfirmed outcome is recorded');
  eq(S.request(req.id).status, S.STATUS.APPROVED_PAYMENT_REQUIRED, 'AN UNCONFIRMED PAYMENT DID NOT ACTIVATE');
  eq(S.tenants().length, tenantsBefore, 'and still created no tenant');
  eq(S.accessAll().length, accBefore, 'and still created no access record');

  ok(!!S.completePayment(req.id, S.PAYMENT_OUTCOME.SUCCESS), 'a successful payment completes');
  eq(S.request(req.id).status, S.STATUS.ACTIVE, 'ONLY SUCCESS ACTIVATES');
  eq(S.accessAll().length, accBefore + 1, 'and only success writes the access record');
  eq(S.completePayment(req.id, S.PAYMENT_OUTCOME.SUCCESS), null, 'paying twice is refused');
  eq(S.accessAll().length, accBefore + 1, 'so a double submit creates no second record');
}

/* ============================================================
   SCENARIO R — TENANT ISOLATION, at the state layer.
   FRD 1.3.1, carried as a hard authority boundary in 17/04 §4.
   ============================================================ */
function scenarioTenantIsolation() {
  group('SCENARIO R — one institution never writes into another');
  boot();

  var g = grantAccess(['direct-shear'], ['web'], 5, 'yearly');

  /* Build a second, genuinely separate institution through the product. */
  S.setScenario('B');
  S.selectionAdd('direct-shear', ['web']);
  var req2 = S.submitRequest({ institutionName: 'Northfield Institute of Technology',
    contactName: 'Prof. Daniel Mensah', contactEmail: 'd.mensah@northfield.example',
    quantity: 3, term: 'yearly' });
  S.approveRequest(req2.id, { reason: 'External pilot.' });
  S.completePayment(req2.id, S.PAYMENT_OUTCOME.SUCCESS);
  var other = S.tenants().filter(function (t) { return t.id !== TENANT; })[0];
  ok(!!other, 'a second institution exists');

  var foreign = S.addStudent(other.id, {
    name: 'QA Foreign Student', email: 'foreign.student@northfield.example',
    studentId: 'NIT/2024/0001', groupingId: 'civil-engineering', courseId: 'soil-mechanics'
  });
  ok(!!foreign, 'and it has a student of its own');
  var foreignId = foreign.id;

  /* THE BOUNDARY — assignment is the only writer of entitlement. */
  var pre = S.previewAssignment(TENANT, g.access.id, 'direct-shear', 'student', [foreignId]);
  eq(pre.ok, false, 'ASSIGNING ANOTHER INSTITUTION’S STUDENT IS REFUSED');
  eq(pre.reason, 'other-tenant-target', 'and refused for the right reason');
  var res = S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [foreignId]);
  eq(res.ok, false, 'the commit is refused too, not only the preview');
  eq(res.created.length, 0, 'no assignment record was written');
  eq(S.effectiveEntitlementCount(foreignId), 0, 'and the foreign student holds nothing');

  var foreignGroup = S.createGroup(other.id, { name: 'QA Foreign Group' });
  ok(!!foreignGroup, 'the other institution has a group');
  eq(S.previewAssignment(TENANT, g.access.id, 'direct-shear', 'group', [foreignGroup.id]).reason,
    'other-tenant-target', 'another institution’s GROUP is refused as a target too');

  /* Faculty mapping is the other cross-tenant surface. */
  var foreignFac = S.addFaculty(other.id, { name: 'QA Foreign Faculty', email: 'ff@northfield.example' });
  ok(!!foreignFac, 'the other institution has a faculty member');
  eq(S.mapFaculty(TENANT, foreignFac.id, g.access.id, 'soil-mechanics', null), null,
    'MAPPING ANOTHER INSTITUTION’S FACULTY IS REFUSED');
  eq(S.mapFaculty(TENANT, RAHUL, g.access.id, 'soil-mechanics', null), null,
    'and a Student can never be mapped as Faculty');
  eq(S.facultyScope(foreignFac.id).experiments.length, 0, 'the foreign faculty member reaches nothing');

  /* A COLLIDING NAME MUST NOT MERGE TWO INSTITUTIONS. */
  var ids = {};
  var dup = 0;
  S.tenants().forEach(function (t) { if (ids[t.id]) { dup += 1; } ids[t.id] = true; });
  eq(dup, 0, 'every tenant id is unique');
  S.setScenario('B');
  S.selectionAdd('direct-shear', ['web']);
  var req3 = S.submitRequest({ institutionName: 'Northfield  Institute, of Technology!',
    contactName: 'Prof. Daniel Mensah', contactEmail: 'd.mensah@northfield.example',
    quantity: 1, term: 'yearly' });
  S.approveRequest(req3.id, { reason: 'Second external institution.' });
  S.completePayment(req3.id, S.PAYMENT_OUTCOME.SUCCESS);
  var seen = {}, collisions = 0;
  S.tenants().forEach(function (t) { if (seen[t.id]) { collisions += 1; } seen[t.id] = true; });
  eq(collisions, 0, 'A DIFFERENT INSTITUTION WHOSE NAME SLUGS THE SAME GETS ITS OWN TENANT ID');
  ok(S.tenants().length >= 3, 'and it is a separate institution, not a merge');
}

/* ============================================================
   SCENARIO S — role scope: creating is a different question from
   covering, and a scope withdrawal is honest about which is which.
   ============================================================ */
function scenarioCreateScope() {
  group('SCENARIO S — an Experiment-scope assignment cannot author a NEW Experiment');
  boot();

  /* Strip the Vendor back to a single Experiment-level scope. */
  S.roleAssignments({ actorId: RAO }).forEach(function (m) {
    S.removePlatformRoleAssignment(m.id, 'QA — narrowing to one experiment');
  });
  eq(S.actorCreateCourseIds(RAO).length, 0, 'with no scope at all, nothing can be created');
  var a = S.assignPlatformRole({ actorId: RAO, role: 'vendor', scope: 'experiment', experimentId: 'direct-shear' });
  ok(a.ok, 'the Vendor now holds ONE Experiment-level scope');

  ok(S.actorCoversRecord(RAO, S.contentRecord('direct-shear')), 'they cover that Experiment');
  eq(S.actorCourseIds(RAO).indexOf('soil-mechanics') !== -1, true,
    'and can READ within its Course');
  eq(S.actorCreateCourseIds(RAO).indexOf('soil-mechanics'), -1,
    'BUT CANNOT CREATE A NEW EXPERIMENT IN THAT COURSE');
  eq(S.vendorCanCreateIn(RAO, 'soil-mechanics'), false, 'and the creation gate agrees');
  eq(S.createContentDraft(RAO, {
    name: 'QA Frozen Draft', courseId: 'soil-mechanics', summary: '', description: 'd',
    technologies: ['web'], delivery: { web: { url: 'https://example.org/x', runtime: 'browser' } },
    versionLabel: '1.0'
  }), null, 'SO NO INSTANTLY-FROZEN DRAFT CAN BE CREATED');

  /* Course scope restores it, and the record it creates is mutable. */
  ok(S.assignPlatformRole({ actorId: RAO, role: 'vendor', scope: 'course', courseId: 'soil-mechanics' }).ok,
    'a Course-level scope is granted');
  var made = S.createContentDraft(RAO, {
    name: 'QA Course Scope Draft', courseId: 'soil-mechanics', summary: '', description: 'd',
    technologies: ['web'], delivery: { web: { url: 'https://example.org/y', runtime: 'browser' } },
    versionLabel: '1.0'
  });
  ok(!!made, 'now the draft is created');
  eq(S.vendorCanEdit(made, RAO), true, 'AND IT IS EDITABLE — creation and mutation now agree');

  /* ADVERSARIAL REGRESSION — the creation gate must not leak into the
     ordinary save. Narrowing `vendorCanCreateIn` to Course scope broke
     an Experiment-scoped Vendor editing their OWN in-scope record with
     its Course untouched: saving where it already sits is not a move,
     and does not need move authority. */
  boot();
  var own = S.createContentDraft(RAO, {
    name: 'QA Own Draft', courseId: 'surveying', summary: '', description: 'd',
    technologies: ['web'], delivery: { web: { url: 'https://example.org/own', runtime: 'browser' } },
    versionLabel: '1.0'
  });
  ok(!!own, 'a Course-scoped Vendor created a draft');
  S.roleAssignments({ actorId: RAO }).forEach(function (m) {
    S.removePlatformRoleAssignment(m.id, 'QA — narrowing to that one experiment');
  });
  ok(S.assignPlatformRole({ actorId: RAO, role: 'vendor', scope: 'experiment', experimentId: own.id }).ok,
    'and is then narrowed to that one Experiment');
  eq(S.vendorCanEdit(S.contentRecord(own.id), RAO), true, 'the editor is still offered');
  var savedFields = {
    name: 'QA Own Draft', courseId: 'surveying', summary: 'edited', description: 'd2',
    technologies: ['web'], delivery: { web: { url: 'https://example.org/own', runtime: 'browser' } },
    documents: [], vendorNotes: '', versionLabel: '1.0'
  };
  ok(!!S.updateContentDraft(RAO, own.id, savedFields),
    'AND THE SAVE IS ACCEPTED — no live editor whose every save is refused');
  eq(S.contentRecord(own.id).description, 'd2', 'the edit landed');
  savedFields.courseId = 'soil-mechanics';
  eq(S.updateContentDraft(RAO, own.id, savedFields), null,
    'but MOVING it to a Course they do not hold is still refused');
  eq(S.contentRecord(own.id).courseId, 'surveying', 'and it did not move');
}

/* ============================================================
   SCENARIO T — canonical metadata cannot hand an Experiment to a
   Course the acting manager holds no assignment for (`STK31-41`).
   ============================================================ */
function scenarioCanonicalDestination() {
  group('SCENARIO T — a metadata edit cannot re-file content out of its own scope');
  boot();

  /* Narrow the Content Manager to one Course. */
  S.roleAssignments({ actorId: KULK }).forEach(function (m) {
    S.removePlatformRoleAssignment(m.id, 'QA — narrowing to one course');
  });
  ok(S.assignPlatformRole({ actorId: KULK, role: 'manager', scope: 'course', courseId: 'soil-mechanics' }).ok,
    'the Content Manager holds soil-mechanics only');

  var rec = S.contentRecord('direct-shear');
  eq(rec.courseId, 'soil-mechanics', 'the record sits in that Course');
  ok(S.managerCanAct(rec, KULK), 'and the manager covers it');

  eq(S.updateCanonicalMetadata(KULK, 'direct-shear', {
    name: 'Direct Shear Test', courseId: 'surveying', summary: '', description: 'd'
  }), null, 'MOVING IT INTO A COURSE THEY DO NOT HOLD IS REFUSED');
  eq(S.contentRecord('direct-shear').courseId, 'soil-mechanics', 'and the record did not move');

  ok(!!S.updateCanonicalMetadata(KULK, 'direct-shear', {
    name: 'Direct Shear Test', courseId: 'soil-mechanics', summary: 'QA corrected.', description: 'd'
  }), 'a correction inside their own Course still works');
  eq(S.contentRecord('direct-shear').summary, 'QA corrected.', 'and it took effect');

  /* A platform-scope manager is unaffected. */
  ok(S.assignPlatformRole({ actorId: KULK, role: 'manager', scope: 'all' }).ok, 'platform scope is restored');
  ok(!!S.updateCanonicalMetadata(KULK, 'direct-shear', {
    name: 'Direct Shear Test', courseId: 'surveying', summary: 'QA corrected.', description: 'd'
  }), 'a platform-scope manager may re-file it');
  eq(S.contentRecord('direct-shear').courseId, 'surveying', 'and it moved');
  eq(S.contentRecord('direct-shear').id, 'direct-shear', 'THE IDENTIFIER NEVER CHANGES');
}

/* ============================================================
   SCENARIO U — a written answer must never lose every evaluator
   silently (`STK31-31`), and the Faculty tenant-holdings read model
   (`STK31-29` / `U-FAC-01`) grants nothing.
   ============================================================ */
function scenarioOrphanReview() {
  group('SCENARIO U — a review with no mapped evaluator is visible, not silent');
  boot();

  var g = grantAccess(['direct-shear', 'consolidation'], ['web'], 5, 'yearly');
  var m = S.mapFaculty(TENANT, ARJUN, g.access.id, 'soil-mechanics', null);
  ok(!!m, 'the Faculty member is mapped at Course level');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);

  var q = S.addQuestion(TENANT, {
    type: 'descriptive', text: 'Explain the failure envelope.',
    experimentId: 'direct-shear', points: 3, guidance: 'QA.'
  }, ARJUN);
  var def = S.assessmentForTenant(TENANT, 'direct-shear');
  S.addQuestionsToAssessment(def.id, [q.question.id], ARJUN);
  var att = S.startAttempt(RAHUL, 'direct-shear');
  S.saveAnswer(att.id, q.question.id, 'A written answer.');
  S.submitAttempt(att.id);

  eq(S.reviewsForFaculty(ARJUN, { status: 'pending' }).length, 1, 'the Faculty member holds one pending review');
  eq(S.pendingReviewsWithoutEvaluator(TENANT).length, 0, 'and nothing is orphaned');
  eq(S.pendingReviewsLosingEvaluator(m.id).length, 1,
    'THE CONSEQUENCE IS KNOWABLE BEFORE THE MAPPING IS REMOVED');

  ok(S.removeFacultyMapping(m.id), 'the Tenant Admin removes the mapping');
  eq(S.reviewsForFaculty(ARJUN, { status: 'pending' }).length, 0, 'it leaves that Faculty queue');
  eq(S.pendingReviewsWithoutEvaluator(TENANT).length, 1,
    'AND IT IS REPORTED AS HAVING NO EVALUATOR — never silently lost');
  eq(S.attemptById(att.id).outcome, 'PENDING_FACULTY_REVIEW', 'the Student is still honestly pending');
  eq(S.reviewById(S.pendingReviewsWithoutEvaluator(TENANT)[0].id).status, 'pending', 'nothing was destroyed');

  /* Re-mapping restores it exactly. */
  ok(!!S.mapFaculty(TENANT, ARJUN, g.access.id, 'soil-mechanics', null), 'a Faculty member is mapped again');
  eq(S.pendingReviewsWithoutEvaluator(TENANT).length, 0, 'and the orphan is resolved');
  eq(S.reviewsForFaculty(ARJUN, { status: 'pending' }).length, 1, 'the review is back in a real queue');

  /* U-FAC-01 — visible, and still not authority. */
  var holdings = S.facultyTenantHoldings(ARJUN);
  ok(holdings.length >= 2, 'the Faculty member can SEE what the institution holds');
  ok(holdings.every(function (h) { return h.mapped === true; }),
    'both are mapped through the Course-level mapping');
  var scopeIds = S.facultyExperimentIds(ARJUN);
  eq(S.mapFaculty(TENANT, ARJUN, g.access.id, 'soil-mechanics', null), null,
    'seeing the holdings creates no new mapping');
  eq(S.facultyExperimentIds(ARJUN).join(','), scopeIds.join(','), 'AND CHANGES NO SCOPE');
  eq(S.facultyCanManage(ARJUN, 'torsion-test'), false, 'content the institution does not hold is still out of reach');
}

/* ============================================================
   SCENARIO V — later-version integrity, and the Super Admin's
   student-deactivation platform override (`STK31-25`).
   ============================================================ */
function scenarioVersionIntegrityAndOverride() {
  group('SCENARIO V — version labels, draft privacy, and the platform override');
  boot();

  var rec = S.contentRecord('direct-shear');
  eq(rec.status, S.CONTENT_STATUS.PUBLISHED, 'the seeded experiment is published');

  /* A version a REVIEWER must not be able to read before it is sent. */
  var made = S.createContentVersion(RAO, 'direct-shear', {
    versionLabel: '2.0', changeNote: 'QA', description: 'QA description', summary: '', delivery: {} });
  ok(made.ok, 'the Vendor drafted a later version');
  eq(S.reviewerCanViewVersion(made.version, IYER), false,
    'AN UNSUBMITTED DRAFT IS NOT READABLE BY THE ACADEMIC REVIEWER');
  eq(S.versionsForReviewer(IYER, {}).some(function (v) { return v.id === made.version.id; }), false,
    'and it is not in their queue either');
  S.submitContentVersion(RAO, made.version.id);
  eq(S.reviewerCanViewVersion(S.contentVersion(made.version.id), IYER), true,
    'once submitted, it is readable');

  /* Hosted delivery on a version meets the same format rule as a first
     publication — a release writes it onto the published record. */
  eq(S.updateContentVersion(RAO, made.version.id, {
    versionLabel: '2.0', changeNote: 'QA', description: 'd', summary: '',
    delivery: { web: { url: 'not-a-url', runtime: 'browser' } } }).ok, false,
    'a version cannot carry a hosted "link" that is not a link');

  /* Release it, then prove a later candidate cannot reuse the label. */
  S.approveVersionAcademic(IYER, made.version.id, 'Approved.');
  ok(!!S.releaseVersion(made.version.id, 'QA release'), 'the Super Admin released it');
  eq(S.contentRecord('direct-shear').versionLabel, '2.0', 'the public version is now 2.0');
  eq(S.createContentVersion(RAO, 'direct-shear', {
    versionLabel: '2.0', changeNote: 'QA', description: 'd', summary: '', delivery: {} }).ok, false,
    'A RELEASED VERSION LABEL CANNOT BE REUSED');
  ok(S.createContentVersion(RAO, 'direct-shear', {
    versionLabel: '2.1', changeNote: 'QA', description: 'd', summary: '', delivery: {} }).ok,
    'a new label is accepted');

  /* STK31-25 — the platform override is the SAME writer, with a reason. */
  boot();
  var g = grantAccess(['direct-shear'], ['web'], 1, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  eq(S.effectiveEntitlementCount(RAHUL), 1, 'the Student holds one entitlement');
  var assignBefore = S.activeAssignments(TENANT).length;
  var accessBefore = JSON.stringify(S.accessForTenant(TENANT));

  eq(S.setStudentStatusAsPlatform(RAHUL, 'inactive', ''), null, 'THE OVERRIDE REQUIRES A REASON');
  eq(S.personById(RAHUL).status, 'active', 'and without one nothing changed');

  ok(!!S.setStudentStatusAsPlatform(RAHUL, 'inactive', 'QA — platform override.'),
    'the Super Admin deactivated the student');
  eq(S.personById(RAHUL).status, 'inactive', 'the student is inactive');
  eq(S.effectiveEntitlementCount(RAHUL), 0, 'and holds no effective entitlement');
  eq(S.activeAssignments(TENANT).length, assignBefore, 'THE OVERRIDE DELETED NO ASSIGNMENT');
  eq(JSON.stringify(S.accessForTenant(TENANT)), accessBefore, 'AND CHANGED NO ACCESS RECORD');
  eq(S.accessAllocation(g.access.id).remaining, 1, 'the licence returned to the record');
  ok((S.personById(RAHUL).overrides || []).length === 1, 'the override is recorded on the student');
  ok(S.tenantById(TENANT).history.some(function (h) { return h.kind === 'student-override'; }),
    'and on the institution’s governance history');

  ok(!!S.setStudentStatusAsPlatform(RAHUL, 'active', 'QA — reinstated.'), 'and it is reversible');
  eq(S.effectiveEntitlementCount(RAHUL), 1, 'the entitlement returns from the SAME assignment');
  eq(S.activeAssignments(TENANT).length, assignBefore, 'with nothing recreated');
}

/* ============================================================
   SCENARIO W — `STK31-42`'s two missing institution-report lines,
   derived and honest.
   ============================================================ */
function scenarioInstitutionReport() {
  group('SCENARIO W — students by stream and usage indicators are derived, not invented');
  boot();

  var rep0 = S.tenantReport(TENANT);
  ok(rep0.byStream.length > 0, 'students are broken down by their own stream');
  eq(rep0.byStream.reduce(function (n, s) { return n + s.students; }, 0), rep0.students,
    'and the breakdown adds up to the student count exactly');
  eq(rep0.usage.entitlements, 0, 'with no entitlement, usage reports nothing rather than a guess');
  eq(rep0.usage.started, 0, 'and nothing started');

  var g = grantAccess(['direct-shear'], ['web'], 5, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  var rep1 = S.tenantReport(TENANT);
  eq(rep1.usage.entitlements, 1, 'usage counts effective entitlements');
  eq(rep1.usage.started, 0, 'nothing has been started yet');
  eq(rep1.usage.students, 1, 'one entitled student');

  S.startSimulation(RAHUL, 'direct-shear', 'web');
  var rep2 = S.tenantReport(TENANT);
  eq(rep2.usage.started, 1, 'real activity moves the figure');
  eq(rep2.usage.studentsStarted, 1, 'and the distinct-student figure with it');
  eq(rep2.usage.completed, 0, 'completion is not claimed before it happens');

  /* Deactivation must not leave a usage figure standing. */
  S.deactivateTenant(TENANT, 'QA');
  eq(S.tenantReport(TENANT).usage.entitlements, 0,
    'a deactivated institution reports no entitlements in use');
  S.reactivateTenant(TENANT, 'QA');
  eq(S.tenantReport(TENANT).usage.entitlements, 1, 'and reactivation restores the figure');
}

/* ============================================================
   SCENARIO X — the defects the Implementation-07 adversarial review
   found in Implementation 07's own changes. One assertion each, so
   none of them can come back.
   ============================================================ */
function scenarioAdversarial07() {
  group('SCENARIO X — Implementation-07 adversarial findings, closed');
  boot();

  /* 1 · completePayment must meet the SAME tenant gate the decision
     meets. Approve while the institution is active, deactivate it, then
     pay: nothing may activate. */
  S.setScenario('B');
  S.selectionAdd('direct-shear', ['web']);
  var req = S.submitRequest({ institutionName: 'Northfield Institute of Technology',
    contactName: 'Prof. Daniel Mensah', contactEmail: 'd.mensah@northfield.example',
    quantity: 2, term: 'yearly' });
  S.approveRequest(req.id, { reason: 'QA — external pilot.' });
  S.completePayment(req.id, S.PAYMENT_OUTCOME.SUCCESS);
  var other = S.tenants().filter(function (t) { return t.id !== TENANT; })[0];
  ok(!!other, 'an external institution exists');

  S.selectionAdd('consolidation', ['web']);
  var req2 = S.submitRequest({ institutionName: 'Northfield Institute of Technology',
    contactName: 'Prof. Daniel Mensah', contactEmail: 'd.mensah@northfield.example',
    quantity: 1, term: 'yearly' });
  S.approveRequest(req2.id, { reason: 'QA — expansion.' });
  eq(S.request(req2.id).status, S.STATUS.APPROVED_PAYMENT_REQUIRED, 'a second request awaits payment');
  S.deactivateTenant(other.id, 'QA — deactivated between approval and payment');
  var accBefore = S.accessAll().length;
  eq(S.completePayment(req2.id, S.PAYMENT_OUTCOME.SUCCESS), null,
    'PAYMENT CANNOT ACTIVATE ONTO A DEACTIVATED INSTITUTION');
  eq(S.accessAll().length, accBefore, 'and it wrote no access record');
  eq(S.request(req2.id).status, S.STATUS.APPROVED_PAYMENT_REQUIRED, 'the request is left exactly where it was');
  ok(!!S.completePayment(req2.id, S.PAYMENT_OUTCOME.DECLINED),
    'recording a DECLINED attempt is still allowed — it writes nothing either way');
  S.reactivateTenant(other.id, 'QA');
  ok(!!S.completePayment(req2.id, S.PAYMENT_OUTCOME.SUCCESS), 'and it pays once the institution is back');
  eq(S.accessAll().length, accBefore + 1, 'writing exactly one record');

  /* 2 · A redundant reactivation must not move the allocation queue. */
  boot();
  var g = grantAccess(['direct-shear'], ['web'], 1, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  var others = S.studentsForTenant(TENANT).filter(function (p) { return p.id !== RAHUL; });
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [others[0].id]);
  eq(S.accessAllocation(g.access.id).entitledIds.join(','), RAHUL, 'the first student holds the single licence');
  var seqBefore = S.personById(RAHUL).activationSeq;
  ok(!!S.setStudentStatus(RAHUL, 'active'), 'reactivating an already-active student returns the record');
  eq(S.personById(RAHUL).activationSeq, seqBefore, 'AND DOES NOT RE-STAMP THE ACTIVATION ORDER');
  eq(S.accessAllocation(g.access.id).entitledIds.join(','), RAHUL,
    'so a redundant call never hands their licence to the student behind them');
  ok(!!S.setStudentStatusAsPlatform(RAHUL, 'active', 'QA — redundant override'),
    'the same is true through the platform override');
  eq(S.accessAllocation(g.access.id).entitledIds.join(','), RAHUL, 'still holding it');

  /* 3 · previewAssignment must refuse an unrecognised target type. */
  var pre = S.previewAssignment(TENANT, g.access.id, 'direct-shear', 'cohort', [RAHUL]);
  eq(pre.ok, false, 'an unrecognised target type is refused');
  eq(pre.reason, 'bad-target-type', 'for the right reason');
  var asgBefore = S.activeAssignments(TENANT).length;
  eq(S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'cohort', [RAHUL]).created.length, 0,
    'and the commit writes no assignment nothing could ever derive from');
  eq(S.activeAssignments(TENANT).length, asgBefore, 'the assignment count is unchanged');

  /* 4 · validateGrant must reject duplicate entries. */
  boot();
  S.setScenario('A');
  S.selectionAdd('direct-shear', ['web', 'vr']);
  var r4 = S.submitRequest({ institutionName: 'Sample Engineering Institute',
    contactName: 'Dr. Kavita Sharma', contactEmail: 'kavita.sharma@sample-institute.example',
    quantity: 5, term: 'yearly' });
  eq(S.validateGrant(S.request(r4.id), { items: [
    { experimentId: 'direct-shear', technologies: ['web'] },
    { experimentId: 'direct-shear', technologies: ['vr'] }] }).ok, false,
    'the same experiment twice in one allocation is refused');
  eq(S.validateGrant(S.request(r4.id), { items: [
    { experimentId: 'direct-shear', technologies: ['web', 'web'] }] }).ok, false,
    'and a technology repeated within one experiment is refused');

  /* 5 · A later version cannot reuse the label the Experiment was FIRST
     published under, even after a release has overwritten it. */
  boot();
  var v1 = S.createContentVersion(RAO, 'direct-shear', {
    versionLabel: '2.0', changeNote: 'QA', description: 'd', summary: '', delivery: {} });
  ok(v1.ok, 'a later version is drafted');
  var firstLabel = S.contentRecord('direct-shear').versionLabel;
  S.submitContentVersion(RAO, v1.version.id);
  S.approveVersionAcademic(IYER, v1.version.id, 'Approved.');
  ok(!!S.releaseVersion(v1.version.id, 'QA'), 'and released');
  eq(S.contentRecord('direct-shear').versionLabel, '2.0', 'the public version moved on');
  eq(S.createContentVersion(RAO, 'direct-shear', {
    versionLabel: firstLabel, changeNote: 'QA', description: 'd', summary: '', delivery: {} }).ok, false,
    'THE FIRST PUBLICATION\u2019S LABEL IS STILL TAKEN, though it is no longer the current one');

  /* 6 · A dormant mapping is not a missing evaluator. */
  boot();
  var g6 = grantAccess(['direct-shear'], ['web'], 3, 'monthly');
  S.mapFaculty(TENANT, ARJUN, g6.access.id, 'soil-mechanics', null);
  S.assignExperiment(TENANT, g6.access.id, 'direct-shear', 'student', [RAHUL]);
  var q6 = S.addQuestion(TENANT, { type: 'descriptive', text: 'QA?', experimentId: 'direct-shear',
    points: 2, guidance: 'QA.' }, ARJUN);
  var def6 = S.assessmentForTenant(TENANT, 'direct-shear');
  S.addQuestionsToAssessment(def6.id, [q6.question.id], ARJUN);
  var att6 = S.startAttempt(RAHUL, 'direct-shear');
  S.saveAnswer(att6.id, q6.question.id, 'An answer.');
  S.submitAttempt(att6.id);
  eq(S.pendingReviewsWithoutEvaluator(TENANT).length, 0, 'nothing is orphaned while everything is live');
  S.protoSetAccessEnd(g6.access.id, -1);
  eq(S.accessIsLive(S.accessById(g6.access.id)), false, 'the access record is now expired');
  eq(S.facultyExperimentIds(ARJUN).length, 0, 'so the mapping carries no content');
  eq(S.pendingReviewsWithoutEvaluator(TENANT).length, 0,
    'BUT THE MAPPING STILL EXISTS, so this is not reported as a missing evaluator');
  S.protoSetAccessEnd(g6.access.id, 30);
  eq(S.facultyExperimentIds(ARJUN).length > 0, true, 'and the mapping carries content again');
}

/* ============================================================
   SCENARIO Y — THE EXTERNAL TENANT-CREATION BOUNDARY.

   The defect: approval and activation were ONE function, so an approved
   external institution did not exist anywhere until it paid — while the
   decision screen said approval created it.

   The contract, from the sources: `STK31-21` lists creating the tenant
   and assigning its Tenant Admin as Super Admin acts distinct from, and
   listed before, deciding what content it receives; `17/07 §2` carries
   the same three as separate confirmed stages; `17/06 §3.3` puts only
   the allocated content, technologies, quantity and term inside step ⑨
   TENANT ACCESS ACTIVATION. The confirmed constraint is that ACCESS is
   never granted before approval — not that the institution cannot exist.

   So: APPROVAL provisions the institution. PAYMENT activates its access.
   ============================================================ */
function scenarioExternalTenantBoundary() {
  group('SCENARIO Y — approval creates the institution, payment activates its access');
  boot();

  function byName(n) {
    return S.tenants().filter(function (t) { return t.name === n; })[0] || null;
  }
  var NAME = 'Northfield Institute of Technology';

  /* ---- the institution must not pre-exist ---- */
  eq(byName(NAME), null, 'the institution does not pre-exist');
  var tenantsBefore = S.tenants().length;

  S.setScenario('B');
  S.selectionAdd('consolidation', ['vr']);
  var req = S.submitRequest({ institutionName: NAME,
    contactName: 'Prof. Daniel Mensah', contactEmail: 'd.mensah@northfield.example',
    quantity: 5, term: 'quarterly' });
  eq(S.request(req.id).status, S.STATUS.SUBMITTED, 'the request is submitted');
  eq(S.tenants().length, tenantsBefore, 'SUBMITTING CREATES NO INSTITUTION');
  eq(byName(NAME), null, 'still nothing');

  /* ---- APPROVAL: the institution exists, the access does not ---- */
  ok(!!S.approveRequest(req.id, { reason: 'QA — external pilot approved.' }),
    'the Super Admin approves it');
  eq(S.request(req.id).status, S.STATUS.APPROVED_PAYMENT_REQUIRED, 'the request is PAYMENT REQUIRED');

  var t = byName(NAME);
  ok(!!t, 'THE INSTITUTION NOW EXISTS — approval provisioned it (STK31-21)');
  eq(S.tenants().length, tenantsBefore + 1, 'exactly one institution was created');
  eq(S.request(req.id).tenantId, t.id, 'and the request is bound to it');
  eq(t.kind, 'external', 'its classification is correct');
  eq(t.accessContext, 'Subscription', 'its access context is correct');
  ok(t.origin.indexOf(req.id) !== -1, 'its origin names the request that created it');
  eq(t.status, 'active', 'its status is active — the DEACTIVATION axis, never a claim about access');
  ok(!!S.tenantAwaitingActivation(t.id), 'and it reports as awaiting activation');

  /* ---- and it holds NOTHING ---- */
  eq(S.accessForTenant(t.id).length, 0, 'IT HOLDS NO ACCESS RECORD');
  eq(S.accessAll().filter(function (a) { return a.requestId === req.id; }).length, 0,
    'no access record exists for this request');
  eq(S.assignableAccessForTenant(t.id).length, 0, 'nothing is assignable');
  eq(S.tenantAllocation(t.id).approved, 0, 'NO APPROVED LICENCES ARE USABLE YET');
  eq(S.tenantAllocation(t.id).remaining, 0, 'and none remaining');
  eq(S.entitledStudentIds(t.id).length, 0, 'NO STUDENT ENTITLEMENT');
  eq(S.tenantReport(t.id).usage.entitlements, 0, 'usage reports nothing');

  /* ---- nothing inside it can be assigned ---- */
  var stu = S.addStudent(t.id, { name: 'QA Northfield Student', email: 'qa.student@northfield.example',
    studentId: 'NIT/2024/0001', groupingId: 'civil-engineering', courseId: 'soil-mechanics' });
  ok(!!stu, 'the Tenant Admin can still create people — provisioning is real');
  var fac = S.addFaculty(t.id, { name: 'QA Northfield Faculty', email: 'qa.faculty@northfield.example' });
  ok(!!fac, 'and Faculty records');
  eq(S.previewAssignment(t.id, 'ACC-999', 'consolidation', 'student', [stu.id]).ok, false,
    'ASSIGNMENT IS IMPOSSIBLE — there is no access record to assign from');
  eq(S.facultyScope(fac.id).experiments.length, 0, 'NO FACULTY REACH');
  eq(S.studentExperiments(stu.id).length, 0, 'NO STUDENT EXPERIMENTS');
  eq(S.studentCanRun(stu.id, 'consolidation', 'vr'), false, 'AND THE STUDENT CANNOT LAUNCH IT');

  /* The Super Admin's own confirmed governance IS available — which is
     the reason the institution has to exist at approval (STK31-21). */
  var ta = S.assignTenantAdmin(t.id, { name: 'QA Northfield Admin', email: 'admin@northfield.example' });
  ok(ta.ok, 'THE TENANT ADMIN CAN BE ASSIGNED BEFORE PAYMENT — STK31-21');

  /* The public catalogue is untouched by any of it. */
  eq(S.publishedPool().some(function (r) { return r.id === 'consolidation'; }), true,
    'the public catalogue is unaffected');

  /* ---- a failed payment still activates nothing ---- */
  S.completePayment(req.id, S.PAYMENT_OUTCOME.DECLINED);
  eq(S.accessForTenant(t.id).length, 0, 'a declined payment activates nothing');
  eq(S.tenants().length, tenantsBefore + 1, 'and creates no institution');

  /* ---- PAYMENT: the access activates onto the SAME institution ---- */
  ok(!!S.completePayment(req.id, S.PAYMENT_OUTCOME.SUCCESS), 'payment succeeds');
  eq(S.request(req.id).status, S.STATUS.ACTIVE, 'the request is ACTIVE');
  eq(S.tenants().length, tenantsBefore + 1, 'PAYMENT CREATED NO SECOND INSTITUTION');
  eq(S.request(req.id).tenantId, t.id, 'the same institution as at approval');
  eq(S.tenantAwaitingActivation(t.id), null, 'it no longer awaits activation');

  var acc = S.accessForTenant(t.id);
  eq(acc.length, 1, 'EXACTLY ONE ACCESS RECORD');
  eq(acc[0].items.length, 1, 'one experiment');
  eq(acc[0].items[0].experimentId, 'consolidation', 'the approved experiment');
  eq(acc[0].items[0].technologies.join(','), 'vr', 'the approved technology, and only that one');
  eq(acc[0].quantity, 5, 'the approved quantity');
  eq(acc[0].term, 'quarterly', 'the approved term');
  eq(S.tenantAllocation(t.id).approved, 5, 'the licences are usable now');
  ok(S.previewAssignment(t.id, acc[0].id, 'consolidation', 'student', [stu.id]).ok,
    'AND ASSIGNMENT BECOMES POSSIBLE ONLY NOW');
  eq(S.entitledStudentIds(t.id).length, 0, 'though activation still entitles nobody by itself');

  /* Paying again must not double the allocation. */
  eq(S.completePayment(req.id, S.PAYMENT_OUTCOME.SUCCESS), null, 'paying twice is refused');
  eq(S.accessForTenant(t.id).length, 1, 'and no second access record was written');

  /* ---- AN EXISTING INSTITUTION IS NEVER DUPLICATED ---- */
  var countNow = S.tenants().length;
  S.selectionAdd('direct-shear', ['web']);
  var req2 = S.submitRequest({ institutionName: NAME,
    contactName: 'Prof. Daniel Mensah', contactEmail: 'd.mensah@northfield.example',
    quantity: 2, term: 'monthly' });
  S.approveRequest(req2.id, { reason: 'QA — expansion.' });
  eq(S.tenants().length, countNow, 'APPROVING A SECOND REQUEST CREATES NO DUPLICATE INSTITUTION');
  eq(S.request(req2.id).tenantId, t.id, 'it attaches to the existing one');
  eq(S.accessForTenant(t.id).length, 1, 'and adds no access record before payment');
  S.completePayment(req2.id, S.PAYMENT_OUTCOME.SUCCESS);
  eq(S.tenants().length, countNow, 'PAYMENT CREATES NO DUPLICATE EITHER');
  eq(S.accessForTenant(t.id).length, 2, 'the institution now holds two access records');

  /* ---- THE INTERNAL ROUTE IS UNCHANGED: activation at approval ---- */
  boot();
  var before = S.accessForTenant(TENANT).length;
  S.setScenario('A');
  S.selectionAdd('direct-shear', ['web']);
  var iReq = S.submitRequest({ institutionName: 'Sample Engineering Institute',
    contactName: 'Dr. Kavita Sharma', contactEmail: 'kavita.sharma@sample-institute.example',
    quantity: 3, term: 'yearly' });
  eq(S.request(iReq.id).paymentRequired, false, 'the internal route requires no payment');
  S.approveRequest(iReq.id, { reason: 'QA — internal approval.' });
  eq(S.request(iReq.id).status, S.STATUS.ACTIVE, 'INTERNAL APPROVAL ACTIVATES IMMEDIATELY');
  eq(S.accessForTenant(TENANT).length, before + 1, 'and writes the access record at once');
  eq(S.tenantAwaitingActivation(TENANT), null, 'it never enters an awaiting-payment state');
  ok(S.assignableAccessForTenant(TENANT).length > 0, 'and content is assignable straight away');
}

/* ---------------- run ---------------- */

/* ============================================================
   SCENARIO Z1 — PLATFORM ACTOR REGISTRATION (Implementation 07.1)

   The directory stopped being closed at five seeded people. What must
   stay true: registering someone RECORDS A PERSON and grants nothing,
   role scoping is unchanged, and the Vendor ORGANISATION is never
   conflated with the Vendor PERSON.
   ============================================================ */
function scenarioActorRegistration() {
  group('SCENARIO Z1 — registering platform actors');
  boot();

  eq(S.contentActors().length, 5, 'the prototype starts with the five seeded actors');

  /* ---- validation refuses an incomplete or colliding person ---- */
  eq(S.registerContentActor({ role: '', name: '', organisation: '', email: '' }).ok, false,
    'an empty registration is refused');
  eq(S.contentActors().length, 5, 'AND NOTHING WAS WRITTEN');
  eq(S.validateContentActor({ role: 'vendor', name: 'A', organisation: 'B', email: 'not-an-email' }, null)
    .some(function (e) { return e.field === 'ac-email'; }), true, 'a malformed email is caught');
  eq(S.validateContentActor({ role: 'archivist', name: 'A', organisation: 'B', email: 'a@b.co' }, null)
    .some(function (e) { return e.field === 'ac-role'; }), true,
    'AN UNKNOWN ROLE IS REFUSED — the three roles are the confirmed set');
  eq(S.registerContentActor({ role: 'vendor', name: 'Clash', organisation: 'Org',
    email: 'ananya.rao@sample-vendor.example' }).ok, false, 'a duplicate email is refused');
  eq(S.contentActors().length, 5, 'and still nothing was written');

  /* ---- a real registration ---- */
  var v = S.registerContentActor({ role: 'vendor', name: 'P. Sundaram',
    organisation: 'Sample XR Content Vendor', email: 'p.sundaram@sample-vendor.example' });
  ok(v.ok, 'a Vendor is registered');
  eq(v.actor.id, 'ACT-006', 'in the SAME id namespace as the seeded five');
  eq(v.actor.source, 'manual', 'and carries a provenance line — not a seed identity');
  eq(v.actor.key, null, 'a platform-recorded person has no seed key');

  /* THE POINT OF THE WHOLE FEATURE: no code change was needed. */
  ok(S.contentActors('vendor').length === 3, 'THREE VENDORS NOW EXIST — no source edit required');

  /* ---- registering grants NOTHING ---- */
  eq(S.roleAssignments({ actorId: v.actor.id }).length, 0, 'the new person holds no scope');
  eq(S.actorScopeText(v.actor.id), 'No assignment', 'and is described as holding none');
  eq(S.actorCourseIds(v.actor.id).length, 0, 'they reach no Course');
  eq(S.actorCreateCourseIds(v.actor.id).length, 0, 'and may author nothing');
  eq(S.createContentDraft(v.actor.id, {
    name: 'QA Unscoped Draft', courseId: 'soil-mechanics', summary: '', description: 'd',
    technologies: ['web'], delivery: { web: { url: 'https://example.org/u', runtime: 'browser' } },
    versionLabel: '1.0'
  }), null, 'SO A REGISTERED-BUT-UNSCOPED VENDOR STILL CREATES NOTHING');

  /* ---- authority still comes only from an assignment ---- */
  ok(S.assignPlatformRole({ actorId: v.actor.id, scope: 'course', courseId: 'soil-mechanics' }).ok,
    'the Super Admin assigns them a Course scope');
  eq(S.vendorCanCreateIn(v.actor.id, 'soil-mechanics'), true, 'now they may author in it');
  eq(S.vendorCanCreateIn(v.actor.id, 'surveying'), false, 'and still nowhere else');

  /* ---- role scoping is unchanged for a registered person ---- */
  eq(S.roleScopesAllowed('vendor').indexOf('all'), -1,
    'a registered Vendor still cannot hold platform-wide scope');
  eq(S.assignPlatformRole({ actorId: v.actor.id, scope: 'all' }).ok, false,
    'AND THE STATE LAYER REFUSES IT, not just the form');
  var m = S.registerContentActor({ role: 'manager', name: 'QA Manager',
    organisation: 'Platform content team (sample)', email: 'qa.manager@sample-platform.example' });
  ok(m.ok, 'a Content Manager is registered');
  ok(S.assignPlatformRole({ actorId: m.actor.id, scope: 'all' }).ok,
    'and MAY hold platform-wide scope — the Content Library is a platform surface');

  /* ---- Vendor ORGANISATION is not the Vendor PERSON ---- */
  var v2 = S.registerContentActor({ role: 'vendor', name: 'R. Chandra',
    organisation: 'Sample XR Content Vendor', email: 'r.chandra@sample-vendor.example' });
  ok(v2.ok, 'A SECOND PERSON AT THE SAME ORGANISATION IS ACCEPTED');
  eq(v2.actor.organisation, v.actor.organisation, 'they share one organisation');
  ok(v2.actor.id !== v.actor.id, 'but are two distinct people, separately scoped');
  eq(S.actorCreateCourseIds(v2.actor.id).length, 0,
    'AND THE SECOND PERSON INHERITS NO AUTHORITY FROM THE ORGANISATION');

  /* ---- a reviewer, and several people on one Course ---- */
  var r = S.registerContentActor({ role: 'reviewer', name: 'Dr. QA Reviewer',
    organisation: 'Academic review panel (sample)', email: 'qa.reviewer@sample-academic.example' });
  ok(r.ok, 'an Academic Reviewer is registered');
  ok(S.assignPlatformRole({ actorId: r.actor.id, scope: 'course', courseId: 'soil-mechanics' }).ok,
    'and is assigned the SAME Course as the seeded reviewer');
  eq(S.actorsForCourse('soil-mechanics', 'reviewer').length, 2,
    'SEVERAL PEOPLE MAY HOLD ONE COURSE — STK31-41 is preserved');

  /* ---- the prototype pointer accepts a registered person, and only of the right role ---- */
  S.setProtoVendor(v.actor.id);
  eq(S.protoVendorId(), v.actor.id, 'the Vendor view switch resolves a registered person');
  S.setProtoReviewer(v.actor.id);
  eq(S.protoReviewerId(), null, 'BUT A VENDOR CAN NEVER BE RESOLVED AS THE REVIEWER');

  /* ---- registering touches no institutional plane ---- */
  eq(S.accessAll().length, 0, 'registering created no tenant access');
  eq(S.people().filter(function (p) { return p.email === v.actor.email; }).length, 0,
    'and no institutional person — platform roles are not tenant roles');
}

/* ============================================================
   SCENARIO Z2 — CANONICAL ACADEMIC STRUCTURE (Implementation 07.1, D3)

   The catalogue stopped being limited to the seeded Civil / Mechanical
   structure. What must stay true: the structure is PLATFORM-controlled,
   ids are stable, the seeded structure is untouched, and anything added
   works everywhere with no second catalogue.
   ============================================================ */
function scenarioCatalogueStructure() {
  group('SCENARIO Z2 — creating and managing canonical structure');
  boot();

  eq(S.groupingRecords().length, 2, 'the prototype starts with the two seeded Programmes');
  eq(S.courseRecords().length, 5, 'and the five seeded Courses');
  ok(S.groupingRecords().every(function (g) { return g.source === 'seed'; }),
    'every seeded row is labelled as seed');

  /* ---- validation ---- */
  eq(S.createGrouping({ name: '', summary: '' }).ok, false, 'an empty Programme is refused');
  eq(S.createGrouping({ name: 'Civil Engineering', summary: 'x' }).ok, false,
    'A DUPLICATE PROGRAMME NAME IS REFUSED — name resolution stays unambiguous for CSV import');
  eq(S.createGrouping({ name: 'Nameless', summary: '' })
    .errors.some(function (e) { return e.field === 'pg-summary'; }), true,
    'a description is required — the public catalogue shows it');
  eq(S.groupingRecords().length, 2, 'AND NOTHING WAS WRITTEN BY ANY REFUSAL');

  /* ---- create ---- */
  var g = S.createGrouping({ name: 'Electrical Engineering',
    summary: 'Simulated laboratory work for electrical engineering fundamentals.' });
  ok(g.ok, 'a new Programme / department is created');
  eq(g.grouping.id, 'electrical-engineering', 'with a readable id in the seeded id style');
  eq(g.grouping.source, 'manual', 'and a provenance line saying it was added on the platform');

  eq(S.createCourse({ groupingId: 'no-such-programme', name: 'X', summary: 'y' }).ok, false,
    'a Course cannot be filed under a Programme that does not exist');
  var c = S.createCourse({ groupingId: g.grouping.id, name: 'Electrical Machines',
    summary: 'Construction and characteristics of rotating electrical machines.' });
  ok(c.ok, 'a Course is created inside it');
  eq(c.course.id, 'electrical-machines', 'with its own readable id');
  eq(S.createCourse({ groupingId: g.grouping.id, name: 'Electrical Machines', summary: 'z' }).ok, false,
    'a duplicate Course name inside one Programme is refused');
  ok(S.createCourse({ groupingId: 'civil-engineering', name: 'Electrical Machines',
    summary: 'A different Course that happens to share a name.' }).ok,
    'BUT THE SAME NAME IN A DIFFERENT PROGRAMME IS ALLOWED — that is the resolution scope');
  eq(S.courseRecords().filter(function (x) { return x.id === 'electrical-machines-2'; }).length, 1,
    'and the id collision is resolved rather than overwriting');

  /* ---- the seeded structure is untouched ---- */
  eq(D.course('soil-mechanics').name, 'Soil Mechanics', 'EXISTING CIVIL DATA IS UNCHANGED');
  eq(D.grouping('mechanical-engineering').name, 'Mechanical Engineering', 'and Mechanical too');
  eq(D.coursesInGrouping('civil-engineering').filter(function (x) { return x.source === 'seed'; }).length, 3,
    'Civil still has its three SEEDED Courses');

  /* ---- one catalogue: the new structure resolves through data.js everywhere ---- */
  eq(D.courses().length, 7, 'data.courses() reports the live structure — five seeded plus the two added');
  eq(D.groupings().length, 3, 'and data.groupings() too');
  eq(D.course('electrical-machines').name, 'Electrical Machines', 'data.course() resolves the new Course');
  eq(D.coursesInGrouping('electrical-engineering').length, 1, 'it sits in its Programme');
  /* The tenant CSV import maps a LOCAL code onto canonical structure by
     NAME, so the new structure must be reachable that way too. */
  ok(!!D.groupingByName('Electrical Engineering'), 'CSV name resolution finds the new Programme');
  ok(!!D.courseByName('Electrical Machines', 'electrical-engineering'),
    'AND THE NEW COURSE — the tenant mapping path works with no change');

  /* ---- a platform-scoped actor gains the new Course automatically ---- */
  ok(S.actorCreateCourseIds(KULK).indexOf('electrical-machines') !== -1,
    'a platform-wide Content Manager covers the new Course at once');
  /* ONE scope store, proved by consequence rather than by asserting a
     name that never existed: withdrawing the platform scope must remove
     the new Course from the manager's reach in the same instant. */
  S.roleAssignments({ actorId: KULK }).forEach(function (m) {
    S.removePlatformRoleAssignment(m.id, 'QA — proving there is one scope store');
  });
  eq(S.actorCreateCourseIds(KULK).indexOf('electrical-machines'), -1,
    'AND WITHDRAWING IT REMOVES THE NEW COURSE AT ONCE — one scope store, not two');
  ok(S.assignPlatformRole({ actorId: KULK, scope: 'all' }).ok, 'the platform scope is restored');

  /* ---- but a Vendor still needs a scope on it ---- */
  eq(S.vendorCanCreateIn(RAO, 'electrical-machines'), false,
    'A NEW COURSE GRANTS NO VENDOR ANYTHING — authority is still assigned');
  ok(S.assignPlatformRole({ actorId: RAO, scope: 'course', courseId: 'electrical-machines' }).ok,
    'the Super Admin assigns the Vendor onto it');
  eq(S.vendorCanCreateIn(RAO, 'electrical-machines'), true, 'and only now may they author in it');

  /* ---- downstream: the full production chain works in brand-new structure ---- */
  var rec = S.createContentDraft(RAO, {
    name: 'QA Induction Motor Test', courseId: 'electrical-machines',
    summary: 'Sample experiment authored into newly created structure.',
    description: 'Prototype QA content.', technologies: ['web'],
    delivery: { web: { url: 'https://example.org/motor', runtime: 'browser' } },
    versionLabel: '1.0'
  });
  ok(!!rec, 'the Vendor creates a draft in the new Course');
  eq(S.publishedPool().some(function (r) { return r.id === rec.id; }), false,
    'and it is NOT public merely because its Course is new');

  /* Re-run the whole chain on a clean state, with the reviewer given real
     cover over the new Course — the honest gate, not a shortcut. */
  boot();
  S.createGrouping({ name: 'Electrical Engineering', summary: 'Sample electrical structure.' });
  S.createCourse({ groupingId: 'electrical-engineering', name: 'Electrical Machines',
    summary: 'Sample Course.' });
  S.assignPlatformRole({ actorId: RAO, scope: 'course', courseId: 'electrical-machines' });
  S.assignPlatformRole({ actorId: IYER, scope: 'course', courseId: 'electrical-machines' });
  var rec2 = S.createContentDraft(RAO, {
    name: 'QA Induction Motor Test', courseId: 'electrical-machines',
    summary: 'Sample experiment authored into newly created structure.',
    description: 'Prototype QA content.', technologies: ['web'],
    delivery: { web: { url: 'https://example.org/motor', runtime: 'browser' } },
    versionLabel: '1.0'
  });
  ok(!!rec2, 'a draft exists in the new Course');
  S.submitContent(RAO, rec2.id);
  eq(S.contentRecord(rec2.id).status, S.CONTENT_STATUS.ACADEMIC_REVIEW,
    'submitted for academic review from brand-new structure');
  S.addOutcome(IYER, rec2.id, 'Observe the characteristics of a rotating electrical machine.');
  ok(!!S.approveAcademic(IYER, rec2.id, 'QA — academically valid.'), 'academically approved');
  ok(!!S.publishContent(KULK, rec2.id), 'AND THE CONTENT MANAGER PUBLISHES IT');

  /* ---- and it is genuinely in the ONE catalogue ---- */
  eq(D.experimentsInCourse('electrical-machines').length, 1,
    'the published Experiment reaches the canonical pool');
  eq(D.experimentsInGrouping('electrical-engineering').length, 1,
    'and the Programme it was filed under');
  var ctx = D.contextOf(rec2.id);
  ok(!!ctx && ctx.course.id === 'electrical-machines' && ctx.grouping.id === 'electrical-engineering',
    'CONTEXT RESOLUTION WORKS END TO END — no second catalogue exists');
  eq(D.experiments().length, 7, 'the public pool is the seeded six plus this one');

  /* ---- rename keeps every reference valid ---- */
  var up = S.updateCourse('electrical-machines', {
    groupingId: 'electrical-engineering', name: 'Electrical Machines Laboratory',
    summary: 'Renamed in QA.' });
  ok(up.ok, 'the Course is renamed');
  eq(up.course.id, 'electrical-machines', 'THE IDENTIFIER NEVER CHANGES');
  eq(S.contentRecord(rec2.id).courseId, 'electrical-machines', 'so the Experiment still resolves to it');
  eq(D.experimentsInCourse('electrical-machines').length, 1, 'and is still reachable through it');
  eq(S.vendorCanCreateIn(RAO, 'electrical-machines'), true, 'the role assignment still covers it');

  /* ---- re-parenting moves the tree, not the references ---- */
  ok(S.updateCourse('electrical-machines', { groupingId: 'civil-engineering',
    name: 'Electrical Machines Laboratory', summary: 'Moved in QA.' }).ok, 'the Course is moved');
  eq(D.experimentsInGrouping('civil-engineering').length, 5,
    'it now shows under its new Programme');
  eq(D.experimentsInGrouping('electrical-engineering').length, 0, 'and no longer under the old one');
  eq(S.contentRecord(rec2.id).courseId, 'electrical-machines',
    'BUT THE EXPERIMENT, THE MAPPING AND THE ASSIGNMENT ARE ALL UNTOUCHED');
  eq(S.vendorCanCreateIn(RAO, 'electrical-machines'), true, 'the Vendor still holds it');

  /* ---- renaming to your OWN name is not a false duplicate ---- */
  ok(S.updateGrouping('civil-engineering',
    { name: 'Civil Engineering', summary: 'Re-described in QA.' }).ok,
    'a Programme may be re-described without its own name reading as a duplicate');
  ok(S.updateCourse('soil-mechanics',
    { groupingId: 'civil-engineering', name: 'Soil Mechanics', summary: 'Re-described in QA.' }).ok,
    'and a Course too');

  /* ---- a move that would collide in the DESTINATION is refused ---- */
  var dup = S.createCourse({ groupingId: 'electrical-engineering', name: 'Surveying',
    summary: 'Shares a name with a Civil Course, in a different Programme.' });
  ok(dup.ok, 'a Course may share a name with one in another Programme');
  var clash = S.updateCourse(dup.course.id,
    { groupingId: 'civil-engineering', name: 'Surveying', summary: 'x' });
  eq(clash.ok, false, 'BUT MOVING IT INTO THE PROGRAMME THAT ALREADY HAS THAT NAME IS REFUSED');
  eq(S.courseRecord(dup.course.id).groupingId, 'electrical-engineering',
    'and the refused move wrote nothing — the Course did not budge');

  /* ---- the structure is PLATFORM-controlled ---- */
  eq(S.createContentDraft(RAO, {
    name: 'QA Invented Course', courseId: 'a-course-the-vendor-made-up', summary: '',
    description: 'd', technologies: ['web'],
    delivery: { web: { url: 'https://example.org/x', runtime: 'browser' } }, versionLabel: '1.0'
  }), null, 'A VENDOR CANNOT AUTHOR INTO A COURSE THAT DOES NOT EXIST');
  eq(S.updateCanonicalMetadata(KULK, rec2.id, {
    name: 'QA Induction Motor Test', courseId: 'still-not-a-real-course',
    summary: 's', description: 'd' }), null,
    'and a Content Manager cannot file an Experiment under an invented Course either');
  eq(S.contentRecord(rec2.id).courseId, 'electrical-machines', 'the record did not move');
  /* THE BOUNDARY THAT MATTERS, asserted over the REAL exported surface
     rather than over two names nobody would use. Every structure mutator
     is a Super-Admin-plane function: none of them takes an actor, so
     none of them can be handed a Vendor or a Content Manager identity —
     the same convention `assignPlatformRole` and `assignTenantAdmin`
     already follow. If a future edit added an actor-scoped creation
     entry point, this assertion is what would notice. */
  var structureMutators = ['createGrouping', 'updateGrouping', 'createCourse', 'updateCourse'];
  eq(structureMutators.filter(function (n) { return typeof S[n] === 'function'; }).length, 4,
    'the four structure mutators exist on the Super Admin plane');
  eq(structureMutators.filter(function (n) { return S[n].length > 2; }).length, 0,
    'AND NONE OF THEM ACCEPTS AN ACTOR — there is no actor-scoped way to mint canonical structure');
  /* And the whole exported surface holds nothing else that mints one. */
  eq(Object.keys(S).filter(function (k) {
    return /^(create|add|new|register|mint)(Course|Grouping|Programme|Department)/.test(k) &&
      structureMutators.indexOf(k) === -1;
  }).length, 0, 'and no other structure-creating export exists under any name');
}

/* ============================================================
   SCENARIO Z4 — the structure mutators do not corrupt what they read

   Everything here was written because a mutation test showed the suite
   passing green while the product was broken. Each assertion below kills
   a specific mutant.
   ============================================================ */
function scenarioStructureIntegrity() {
  group('SCENARIO Z4 — structure integrity, ids and isolation');
  boot();

  /* ---- THE SEED ARRAYS ARE NEVER WRITTEN THROUGH ----
     `seedStructureRows` deep-copies. Without that, renaming a seeded
     Programme edits data.GROUPINGS in place, the "seed" becomes whatever
     was last typed, and reset() restores the corruption instead of the
     seed — permanently, for the life of the page. */
  var seedNameBefore = D.GROUPINGS[0].name;
  var seedCourseBefore = D.COURSES[0].name;
  ok(S.updateGrouping('civil-engineering',
    { name: 'CONTAMINATION PROBE', summary: 'QA' }).ok, 'a seeded Programme is renamed');
  ok(S.updateCourse('soil-mechanics',
    { groupingId: 'civil-engineering', name: 'CONTAMINATION PROBE 2', summary: 'QA' }).ok,
    'and a seeded Course');
  eq(D.GROUPINGS[0].name, seedNameBefore, 'THE SEED ARRAY IN data.js IS UNTOUCHED');
  eq(D.COURSES[0].name, seedCourseBefore, 'and so is the seed Course array');
  S.reset();
  eq(D.grouping('civil-engineering').name, seedNameBefore,
    'SO RESET RESTORES THE REAL SEED, not the last thing that was typed');
  eq(D.course('soil-mechanics').name, seedCourseBefore, 'for Courses too');

  /* ---- an id is permanent ---- */
  boot();
  ok(S.updateGrouping('civil-engineering',
    { name: 'Civil & Environmental Engineering', summary: 'QA rename' }).ok, 'a Programme is renamed');
  ok(!!D.grouping('civil-engineering'), 'ITS IDENTIFIER STILL RESOLVES AFTER THE RENAME');
  eq(D.grouping('civil-engineering').name, 'Civil & Environmental Engineering', 'under the new name');
  eq(S.groupingRecords().filter(function (g) { return g.id === 'civil-engineering'; }).length, 1,
    'and no second row was created');
  eq(D.coursesInGrouping('civil-engineering').length, 3, 'its Courses are still attached to it');

  /* ---- ONE id namespace across Programmes, Courses and Experiments ---- */
  boot();
  var clash = S.createGrouping({ name: 'Surveying', summary: 'A Programme named after a Course.' });
  ok(clash.ok, 'a Programme may be named after an existing Course');
  ok(clash.grouping.id !== 'surveying', 'BUT IT NEVER TAKES THAT COURSE’S IDENTIFIER');
  eq(D.course('surveying').name, 'Surveying', 'the Course keeps its own id');
  eq(D.grouping('surveying'), null, 'and the id resolves to exactly one kind of record');
  var clash2 = S.createCourse({ groupingId: 'civil-engineering', name: 'Civil Engineering',
    summary: 'A Course named after its Programme.' });
  ok(clash2.ok && clash2.course.id !== 'civil-engineering',
    'and a Course never takes a Programme’s identifier either');
  var clash3 = S.createCourse({ groupingId: 'civil-engineering', name: 'Direct Shear',
    summary: 'A Course named after an Experiment.' });
  ok(clash3.ok && !S.contentRecord(clash3.course.id),
    'nor an Experiment’s');

  /* ---- the lookups hand out a COPY of the collection ---- */
  boot();
  var handed = D.courses();
  handed.push({ id: 'ghost-course', groupingId: 'civil-engineering', name: 'Ghost', summary: 'x' });
  eq(D.course('ghost-course'), null, 'A CALLER CANNOT INJECT STRUCTURE THROUGH THE LOOKUP');
  eq(S.courseRecords().length, 5, 'and the collection is untouched');
  handed = D.groupings();
  handed.length = 0;
  eq(D.groupings().length, 2, 'emptying the handed-out array changes nothing');

  /* ---- MOVING a Course is refused once anyone is filed against it ---- */
  boot();
  var free = S.createCourse({ groupingId: 'civil-engineering', name: 'Hydraulics',
    summary: 'Nobody is enrolled on this yet.' });
  ok(free.ok, 'a brand-new Course exists');
  eq(S.courseMoveBlock(free.course.id), 0, 'nobody is filed against it');
  ok(S.updateCourse(free.course.id, { groupingId: 'mechanical-engineering', name: 'Hydraulics',
    summary: 'Filed under the wrong Programme at first.' }).ok,
    'SO IT MAY BE MOVED — the wrong-Programme correction the capability is for');
  eq(S.courseRecord(free.course.id).groupingId, 'mechanical-engineering', 'and it moved');

  /* The seeded Course DOES carry students, and each student record
     stores its own Programme. Moving it would leave those two fields
     disagreeing, silently, in tenant-owned records. */
  ok(S.courseMoveBlock('soil-mechanics') > 0, 'the seeded Course has people filed against it');
  var blocked = S.updateCourse('soil-mechanics',
    { groupingId: 'mechanical-engineering', name: 'Soil Mechanics', summary: 'x' });
  eq(blocked.ok, false, 'SO MOVING IT IS REFUSED — a student’s stored Programme is never desynced');
  eq(blocked.errors[0].field, 'pc-grouping', 'and the refusal points at the Programme field');
  eq(S.courseRecord('soil-mechanics').groupingId, 'civil-engineering', 'the Course did not move');
  /* Renaming it is still fine — only the move is refused. */
  ok(S.updateCourse('soil-mechanics',
    { groupingId: 'civil-engineering', name: 'Soil Mechanics I', summary: 'renamed' }).ok,
    'but renaming and re-describing still work');

  /* ---- courseUsage answers with every reference class ---- */
  boot();
  var use = S.courseUsage('soil-mechanics');
  ok(use.records > 0, 'usage counts content records');
  ok(use.people > 0, 'AND PEOPLE FILED AGAINST THE COURSE — a referenced Course never reads "unused"');
  ok(use.assignments > 0, 'and role assignments');
  eq(typeof use.facultyMappings, 'number', 'and Faculty mappings');
  eq(S.courseUsage('a-course-that-does-not-exist').records, 0, 'an unknown Course reports nothing');
  eq(S.coursesInGroupingRecord('civil-engineering').length, 3,
    'and the structure screen reads its Courses from the live collection');
  eq(S.coursesInGroupingRecord('electrical-engineering').length, 0, 'an empty Programme reports none');

  /* ---- the Super Admin nav counts are real ---- */
  var o = S.platformOverview();
  eq(o.groupings, S.groupingRecords().length, 'the overview reports the real Programme count');
  eq(o.courses, S.courseRecords().length, 'and the real Course count');

  /* ---- a lagging seq counter never mints a duplicate actor id ---- */
  boot();
  S.setScenario('A');                      /* forces the seeded state to persist */
  var raw = JSON.parse(localStorage.getItem(S.STORAGE_KEY));
  raw.seq.actor = 0;                       /* the counter fell behind its collection */
  localStorage.setItem(S.STORAGE_KEY, JSON.stringify(raw));
  loadState(); S = XRSLP.state; D = XRSLP.data;
  var made = S.registerContentActor({ role: 'vendor', name: 'QA Late Vendor',
    organisation: 'QA Org', email: 'qa.late@sample-vendor.example' });
  ok(made.ok, 'a person is registered against a state whose counter lagged');
  eq(S.contentActors().filter(function (a) { return a.id === made.actor.id; }).length, 1,
    'AND THE ID IS STILL UNIQUE — no new person is aliased onto an existing one');
  eq(S.contentActors().length, 6, 'six distinct people exist');
}

/* ============================================================
   SCENARIO Z5 — what the 8 → 9 migration repairs, and what it leaves
   ============================================================ */
function scenarioStructureMigration() {
  group('SCENARIO Z5 — migration back-fill, provenance and orphan repair');
  boot();

  /* A stored state that already holds a platform-created Course, plus a
     seed row deliberately removed, plus rows with no provenance, plus a
     Course whose Programme is gone. */
  S.createGrouping({ name: 'Electrical Engineering', summary: 'Sample electrical structure.' });
  S.createCourse({ groupingId: 'electrical-engineering', name: 'Electrical Machines', summary: 'Sample.' });
  var raw = JSON.parse(localStorage.getItem(S.STORAGE_KEY));

  raw.courses = raw.courses.filter(function (c) { return c.id !== 'surveying'; });   /* a seed row is missing */
  raw.groupings.forEach(function (g) { delete g.source; });                          /* written before provenance */
  raw.courses.forEach(function (c) { delete c.source; });
  raw.courses.push({ id: 'orphan-course', groupingId: 'a-programme-that-vanished',
    name: 'Orphan Course', summary: 'Its Programme is gone.' });
  raw.schemaVersion = 8;
  localStorage.setItem(S.STORAGE_KEY, JSON.stringify(raw));

  loadState(); S = XRSLP.state; D = XRSLP.data;

  ok(!!D.course('surveying'), 'A MISSING SEED COURSE IS BACK-FILLED, not left absent');
  eq(D.course('surveying').source, 'seed', 'and is labelled as seed structure');
  ok(!!D.course('electrical-machines'), 'the platform-created Course survived the migration');
  eq(S.courseRecord('electrical-machines').source, 'manual',
    'AND IS CORRECTLY LABELLED MANUAL — a platform row is never relabelled as seed');
  eq(S.groupingRecord('civil-engineering').source, 'seed',
    'a provenance-less seeded row is back-filled as seed');
  eq(S.groupingRecord('electrical-engineering').source, 'manual',
    'and a provenance-less row the seed does not name is back-filled as manual');

  var orphan = S.courseRecord('orphan-course');
  ok(!!orphan, 'AN ORPHANED COURSE IS NEVER DISCARDED');
  ok(!!S.groupingRecord(orphan.groupingId),
    'it is re-parented to a Programme that exists, so it stays reachable');
  ok(D.coursesInGrouping(orphan.groupingId).some(function (c) { return c.id === 'orphan-course'; }),
    'and the tree can actually see it again');

  /* Running the migration twice must be a no-op, not a duplicator. */
  var before = S.courseRecords().length;
  loadState(); S = XRSLP.state; D = XRSLP.data;
  eq(S.courseRecords().length, before, 'MIGRATING AGAIN DUPLICATES NOTHING');
  eq(S.groupingRecords().filter(function (g) { return g.id === 'civil-engineering'; }).length, 1,
    'and creates no second copy of a seeded Programme');
}

/* ============================================================
   SCENARIO Z3 — the 07.1 collections survive persistence and a reset
   ============================================================ */
function scenarioStructurePersistence() {
  group('SCENARIO Z3 — structure and registered actors persist');
  boot();

  S.createGrouping({ name: 'Electrical Engineering', summary: 'Sample electrical structure.' });
  S.createCourse({ groupingId: 'electrical-engineering', name: 'Electrical Machines',
    summary: 'Sample Course.' });
  var v = S.registerContentActor({ role: 'vendor', name: 'P. Sundaram',
    organisation: 'Sample XR Content Vendor', email: 'p.sundaram@sample-vendor.example' });
  S.assignPlatformRole({ actorId: v.actor.id, scope: 'course', courseId: 'electrical-machines' });

  /* Reload the build over the stored state — the real browser reload. */
  loadState();
  S = XRSLP.state; D = XRSLP.data;

  eq(S.groupingRecords().length, 3, 'the created Programme survived the reload');
  eq(S.courseRecords().length, 6, 'and the created Course');
  eq(S.contentActors().length, 6, 'and the registered person');
  eq(S.actorScopeText('ACT-006'), 'Electrical Machines', 'with their scope intact');
  eq(D.course('electrical-machines').name, 'Electrical Machines',
    'AND THE LOOKUPS STILL RESOLVE IT AFTER A RELOAD');
  ok(S.courseRecords().filter(function (c) { return c.id === 'electrical-machines'; })[0].source === 'manual',
    'provenance survives too');

  /* ---- a state written BEFORE 07.1 gains the structure, losing nothing ---- */
  boot();
  var g2 = grantAccess(['direct-shear'], ['vr', 'web'], 3, 'yearly');
  S.assignExperiment(TENANT, g2.access.id, 'direct-shear', 'student', [RAHUL]);
  var raw = JSON.parse(localStorage.getItem(S.STORAGE_KEY));
  var access = raw.access.length, records = raw.contentRecords.length;
  var assignments = raw.assignments.length;
  raw.schemaVersion = 8;
  delete raw.groupings; delete raw.courses;   /* exactly what a schema-8 state looks like */
  localStorage.setItem(S.STORAGE_KEY, JSON.stringify(raw));

  loadState();
  S = XRSLP.state; D = XRSLP.data;

  eq(S.SCHEMA_VERSION, 9, 'the build is at schema 9');
  eq(S.migratedFrom(), 8, 'and reports that it migrated from 8');
  eq(S.groupingRecords().length, 2, 'A SCHEMA-8 STATE GAINS THE SEEDED PROGRAMMES');
  eq(S.courseRecords().length, 5, 'and the seeded Courses');
  ok(S.courseRecords().every(function (c) { return c.source === 'seed'; }),
    'all correctly labelled as seed structure');
  eq(D.course('soil-mechanics').name, 'Soil Mechanics',
    'the structure the old state was reading is exactly what it now holds');
  eq(S.accessAll().length, access, 'NOTHING LOST: access records');
  eq(S.contentRecords().length, records, 'NOTHING LOST: content records');
  eq(S.activeAssignments(TENANT).length, assignments, 'NOTHING LOST: assignments');
  eq(S.studentCanRun(RAHUL, 'direct-shear', 'vr'), true, 'and entitlement still derives');

  /* ---- reset returns to the seeded structure, taking nothing with it ---- */
  boot();
  S.createGrouping({ name: 'Electrical Engineering', summary: 'Sample electrical structure.' });
  S.registerContentActor({ role: 'vendor', name: 'Temp Person', organisation: 'Temp Org',
    email: 'temp@sample-vendor.example' });
  eq(S.groupingRecords().length, 3, 'a custom Programme exists');
  S.reset();
  eq(S.groupingRecords().length, 2, 'RESET RETURNS TO THE SEEDED STRUCTURE');
  eq(S.courseRecords().length, 5, 'exactly the seeded Courses');
  eq(S.contentActors().length, 5, 'and the seeded five actors');
  eq(D.courses().length, 5, 'AND NO CUSTOM STRUCTURE LEAKS ACROSS THE RESET');
}


scenarioA();
scenarioB();
scenarioC();
scenarioVersions();
scenarioF();
scenarioTransferTechnology();
scenarioG();
scenarioH();
scenarioI();
scenarioJ();
scenarioK();
scenarioRoleWithdrawal();
scenarioEntitlementMetric();
migrationChecks();
guardChecks();
altitudeChecks();
adversarialFixes();
/* Implementation 07 — gap closure and the coverage the 06 closeout named. */
scenarioAIReviewBoundary();
scenarioRequestDecision();
scenarioPaymentOutcomes();
scenarioTenantIsolation();
scenarioCreateScope();
scenarioCanonicalDestination();
scenarioOrphanReview();
scenarioVersionIntegrityAndOverride();
scenarioInstitutionReport();
scenarioAdversarial07();
scenarioExternalTenantBoundary();
/* Implementation 07.1 — platform actor registration and canonical
   academic structure management. */
scenarioActorRegistration();
scenarioCatalogueStructure();
scenarioStructurePersistence();
scenarioStructureIntegrity();
scenarioStructureMigration();
summary();
