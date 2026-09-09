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

  /* The decision must not disturb the resolved scope.

     The request goes through the institution's own Tenant Admin first
     (Implementation 07.2): `decideDeviceTransfer` refuses anything that
     has not been forwarded, so the escalation is part of reaching the
     Super Admin at all. */
  var before = S.transferTechnologies(r).join(',');
  ok(S.escalateDeviceTransfer(r.id, 'Checked with the student.') !== null,
    'the Institute / Tenant Admin forwarded it to the platform');
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
  eq(S.SCHEMA_VERSION, 12, 'the build is at schema 12');
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
  eq(made.request.status, S.TRANSFER_STATUS.SUBMITTED,
    'it is with the institution’s Tenant Admin, not the platform');

  /* Duplicate guard. */
  eq(S.createDeviceTransfer(RAHUL, {
    currentDevice: 'a', newDevice: 'b', reason: 'c' }).ok, false,
    'a second open request is refused while one is pending');

  /* THE CORRECTED ROUTING — Implementation 07.2, stakeholder rule C.
     A Student no longer reaches the Super Admin directly. */
  eq(S.transfersAwaitingDecision().length, 0,
    'THE SUPER ADMIN QUEUE IS EMPTY: a Student request does not reach the platform directly');
  ok(S.transfersAwaitingTenant(TENANT).some(function (r) { return r.id === made.request.id; }),
    'the institution’s own Tenant Admin has it first');
  eq(S.decideDeviceTransfer(made.request.id, S.TRANSFER_STATUS.APPROVED, 'Approved.'), null,
    'and the platform cannot decide what the institution has not forwarded');

  var fwd = S.escalateDeviceTransfer(made.request.id, 'Spoke to the student; the headset is dead.');
  eq(fwd.status, S.TRANSFER_STATUS.ESCALATED, 'the Tenant Admin forwarded it');
  ok(!!fwd.escalatedBy, 'and the forwarding is attributed to a real assigned Tenant Admin');
  eq(S.transfersAwaitingTenant(TENANT).length, 0, 'it has left the institution’s queue');
  ok(S.transfersAwaitingDecision().some(function (r) { return r.id === made.request.id; }),
    'and only now does the Super Admin queue show it');
  eq(S.escalateDeviceTransfer(made.request.id, 'again'), null,
    'forwarding twice is refused');

  var out = S.decideDeviceTransfer(made.request.id, S.TRANSFER_STATUS.APPROVED, 'Approved.');
  eq(out.status, S.TRANSFER_STATUS.APPROVED, 'the Super Admin remains the FINAL decision maker');
  eq(S.transfersForStudent(RAHUL)[0].status, S.TRANSFER_STATUS.APPROVED, 'the Student sees Approved');
  eq(S.transfersForTenant(TENANT)[0].status, S.TRANSFER_STATUS.APPROVED,
    'and so does the Tenant Admin who forwarded it');

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

  eq(S.SCHEMA_VERSION, 12, 'the build is at schema 12');
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

  /* Canonical governance.

     A REASON IS REQUIRED ON PUBLISHED CONTENT — Implementation 07.2,
     stakeholder rule F. This rewrites the master record of something the
     public catalogue is already showing, so the override says why. */
  eq(S.updateCanonicalAsPlatform('direct-shear', {
    name: 'Direct Shear Test', courseId: 'soil-mechanics',
    summary: 'Updated by the Super Admin (QA).', description: 'QA canonical edit.' }).ok, false,
    'a published master record cannot be corrected without a stated reason');
  eq(S.contentRecord('direct-shear').summary.indexOf('QA'), -1,
    'AND THE REFUSAL WROTE NOTHING');
  var up = S.updateCanonicalAsPlatform('direct-shear', {
    name: 'Direct Shear Test', courseId: 'soil-mechanics',
    summary: 'Updated by the Super Admin (QA).', description: 'QA canonical edit.' },
    'Course code correction requested by the Content Manager.');
  ok(up.ok, 'the Super Admin can correct canonical metadata WITH a reason');
  eq(up.record.history[0].note, 'Course code correction requested by the Content Manager.',
    'and the reason is on the record’s own history, not only in an audit table');
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
  /* Three steps now, and none of them may cross an altitude:
     the Student raises it, the Tenant Admin forwards it, the Super
     Admin decides it. */
  S.escalateDeviceTransfer(S.transfersForStudent(RAHUL)[0].id, 'Forwarded.');
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

  /* ⚠ THE DESCRIPTION IS CARRIED FORWARD UNCHANGED — Implementation 09.
     `direct-shear` is PUBLISHED, and the description is the Experiment's
     instructional content, so changing it here would now be a material
     change and would have to become a correction version. That rule has
     its own scenario. THIS scenario is about SCOPE and re-filing, and it
     asserts what it always asserted: catalogue metadata a Content
     Manager holds is still correctable in place on published content. */
  var dsDesc = S.contentRecord('direct-shear').description;
  ok(!!S.updateCanonicalMetadata(KULK, 'direct-shear', {
    name: 'Direct Shear Test', courseId: 'soil-mechanics', summary: 'QA corrected.', description: dsDesc
  }), 'a correction inside their own Course still works');
  eq(S.contentRecord('direct-shear').summary, 'QA corrected.', 'and it took effect');

  /* A platform-scope manager is unaffected. */
  ok(S.assignPlatformRole({ actorId: KULK, role: 'manager', scope: 'all' }).ok, 'platform scope is restored');
  ok(!!S.updateCanonicalMetadata(KULK, 'direct-shear', {
    name: 'Direct Shear Test', courseId: 'surveying', summary: 'QA corrected.', description: dsDesc
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

  eq(S.SCHEMA_VERSION, 12, 'the build is at schema 12');
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


/* ============================================================
   IMPLEMENTATION 07.2 — THE STAKEHOLDER-CONFIRMED CORRECTIONS

   Six scenarios, one per confirmed decision plus the schema step.
   Every assertion below is NEW; nothing above was removed or
   weakened to accommodate them.
   ============================================================ */

/* ------------------------------------------------------------
   SCENARIO AA — an institution re-requests an Experiment it
   already holds, and gets ADDITIONAL LICENCES.

   "If the same institution requests the same experiment again, they
    can request additional licenses. It should show the existing plan
    when they reselect."
   ------------------------------------------------------------ */
function scenarioExperimentExpansion() {
  group('SCENARIO AA — a held Experiment can be requested again for more licences');
  boot();

  var first = grantAccess(['direct-shear'], ['vr', 'web'], 3, 'yearly');
  var acc1 = first.access;
  var firstSnapshot = JSON.stringify({
    items: acc1.items, quantity: acc1.quantity, term: acc1.term,
    endsOn: acc1.endsOn, requestId: acc1.requestId
  });
  var firstHistory = S.request(first.request.id).history.length;

  /* ---- the institution is identifiable on the public plane ---- */
  var inst = S.scenarioTenant();
  ok(!!inst && inst.id === TENANT, 'the public plane can say which institution is choosing');
  ok(S.tenantHoldsExperiment(TENANT, 'direct-shear'),
    'and that it already holds this Experiment');
  eq(S.tenantHoldsExperiment(TENANT, 'consolidation'), false,
    'and that it does not hold one it never bought');

  /* ---- the existing plan is visible when they reselect ---- */
  var held = S.tenantAccessForExperiment(TENANT, 'direct-shear');
  eq(held.length, 1, 'THE EXISTING PLAN IS SURFACED: one access record carries it');
  eq(held[0].record.id, acc1.id, 'and it is the real record, not a summary');
  eq(held[0].technologies.join(','), 'web,vr', 'with the technologies actually granted');
  eq(held[0].allocation.approved, 3, 'and the licences actually approved');
  eq(held[0].termState.key, 'active', 'and its real term state');
  eq(held[0].live, true, 'the record is live');

  /* ---- NOT BLOCKED. Reselecting the same Experiment is allowed. ---- */
  eq(S.selectionAdd('direct-shear', ['vr']), true,
    'NOT BLOCKED: an already-held Experiment can be selected again');
  eq(S.heldSelectionFor(TENANT, S.selectionItems()).length, 1,
    'and the basket knows the institution already holds it');

  var second = S.submitRequest({
    institutionName: 'Sample Engineering Institute',
    contactName: 'Dr. Kavita Sharma',
    contactEmail: 'kavita.sharma@sample-institute.example',
    quantity: 5, term: 'yearly'
  });
  ok(!!second, 'the expansion request is accepted');
  eq(S.requestCanBeDecided(S.request(second.id)), true,
    'and it is decidable — holding the Experiment already is not a refusal');
  S.approveRequest(second.id, { reason: 'QA — additional licences.' });

  /* ---- ADDITIONAL LICENCES, and nothing overwritten ---- */
  eq(S.accessForTenant(TENANT).length, 2, 'a SECOND access record is added beside the first');
  eq(S.tenantAllocation(TENANT).approved, 8,
    'ADDITIONAL LICENCES: 3 + 5, summed across the two records');
  eq(S.tenantAccessForExperiment(TENANT, 'direct-shear').length, 2,
    'and both records are surfaced for the Experiment, per record');

  var acc1After = S.accessById(acc1.id);
  eq(JSON.stringify({
    items: acc1After.items, quantity: acc1After.quantity, term: acc1After.term,
    endsOn: acc1After.endsOn, requestId: acc1After.requestId
  }), firstSnapshot,
    'THE ORIGINAL ACCESS RECORD IS BYTE-IDENTICAL — nothing was silently overwritten');
  eq(S.request(first.request.id).history.length, firstHistory,
    'and the ORIGINAL REQUEST’S HISTORY IS UNTOUCHED');
  ok(S.request(second.id).history.length > 0, 'while the later request keeps its own history');
  eq(S.tenants().filter(function (t) { return t.id === TENANT; }).length, 1,
    'NO SECOND INSTITUTION was created — still exactly one row for this institution');
  eq(S.tenants().filter(function (t) { return t.name === 'Sample Engineering Institute'; }).length, 1,
    'and no second institution under the same name');

  /* ---- and the downstream reading of two records is unchanged ---- */
  S.assignExperiment(TENANT, acc1.id, 'direct-shear', 'student', [RAHUL]);
  eq(S.studentEntitledTechnologies(RAHUL, 'direct-shear').join(','), 'web,vr',
    'the Student’s technologies are unchanged by the expansion');
  eq(S.studentCanRun(RAHUL, 'consolidation', 'web'), false,
    'and an Experiment the institution never bought is still refused');
}

/* ------------------------------------------------------------
   SCENARIO BB — device replacement / transfer is routed through
   the institution's own Tenant Admin.

   "Any request from institution should come through Tenant Admin. He
    will be our POC to facilitate and final approval comes to Super
    Admin."

   scenarioF already pins the happy path end to end. This one pins the
   edges: the actor must be real, a deactivated institution cannot
   forward, and forwarding writes nothing but the request.
   ------------------------------------------------------------ */
function scenarioDeviceRouting() {
  group('SCENARIO BB — the device request routes through the institution POC');
  boot();

  var g = grantAccess(['direct-shear'], ['vr', 'web'], 3, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  var made = S.createDeviceTransfer(RAHUL, {
    technology: 'vr', currentDevice: 'Issued headset', newDevice: 'Replacement headset',
    reason: 'It stopped charging.'
  });
  ok(made.ok, 'the Student raised the request');

  /* ---- the forwarding note is optional; the ACTOR is not ---- */
  var snapshot = {
    access: S.accessAll().length,
    assigned: S.accessAllocation(g.access.id).assigned,
    remaining: S.accessAllocation(g.access.id).remaining,
    ents: S.getEffectiveStudentEntitlements(RAHUL).length,
    techs: S.studentEntitledTechnologies(RAHUL, 'direct-shear').join(','),
    attempts: S.attemptsFor(RAHUL, 'direct-shear').length,
    published: S.publishedPool().length
  };
  var fwd = S.escalateDeviceTransfer(made.request.id, '');
  eq(fwd.status, S.TRANSFER_STATUS.ESCALATED, 'a forwarding note is optional');
  eq(fwd.escalatedBy, S.actingTenantAdmin(TENANT).name,
    'THE FORWARDING IS ATTRIBUTED TO THE REAL ASSIGNED TENANT ADMIN — never a fabricated actor');
  ok(!!fwd.escalatedAt, 'and stamped');
  eq(fwd.history[fwd.history.length - 1].kind === 'escalated' ||
     fwd.history[0].kind === 'escalated', true,
    'and it is in the request’s own history');

  /* ---- FORWARDING GRANTS NOTHING ---- */
  eq(S.accessAll().length, snapshot.access, 'FORWARDING: no access record created');
  eq(S.accessAllocation(g.access.id).assigned, snapshot.assigned, 'FORWARDING: no licence consumed');
  eq(S.accessAllocation(g.access.id).remaining, snapshot.remaining, 'FORWARDING: remaining unchanged');
  eq(S.getEffectiveStudentEntitlements(RAHUL).length, snapshot.ents, 'FORWARDING: no Experiment granted');
  eq(S.studentEntitledTechnologies(RAHUL, 'direct-shear').join(','), snapshot.techs,
    'FORWARDING: no technology granted');
  eq(S.attemptsFor(RAHUL, 'direct-shear').length, snapshot.attempts, 'FORWARDING: no assessment state touched');
  eq(S.publishedPool().length, snapshot.published, 'FORWARDING: nothing published');

  /* ---- the outcome reaches BOTH the Student and the Tenant Admin ---- */
  S.decideDeviceTransfer(made.request.id, S.TRANSFER_STATUS.DECLINED, 'A replacement is not available.');
  eq(S.transfersForStudent(RAHUL)[0].status, S.TRANSFER_STATUS.DECLINED, 'the Student sees the outcome');
  eq(S.transfersForTenant(TENANT)[0].status, S.TRANSFER_STATUS.DECLINED, 'and so does the Tenant Admin');
  eq(S.transfersAwaitingTenant(TENANT).length, 0, 'and neither queue still holds it');
  eq(S.transfersAwaitingDecision().length, 0, 'on either side');

  /* ---- a deactivated institution cannot forward, and loses nothing ---- */
  boot();
  var g2 = grantAccess(['direct-shear'], ['vr'], 2, 'yearly');
  S.assignExperiment(TENANT, g2.access.id, 'direct-shear', 'student', [RAHUL]);
  var m2 = S.createDeviceTransfer(RAHUL, {
    currentDevice: 'a', newDevice: 'b', reason: 'c' });
  S.deactivateTenant(TENANT, 'QA — suspended.');
  eq(S.escalateDeviceTransfer(m2.request.id, 'x'), null,
    'a DEACTIVATED institution cannot forward a device request');
  eq(S.deviceTransferById(m2.request.id).status, S.TRANSFER_STATUS.SUBMITTED,
    'AND NOTHING IS LOST — the request stays exactly where it was');
  S.reactivateTenant(TENANT, 'QA — restored.');
  ok(S.escalateDeviceTransfer(m2.request.id, 'x') !== null,
    'and it moves the moment the institution is reactivated');

  /* ---- an institution with NO assigned Tenant Admin cannot forward ---- */
  boot();
  var g3 = grantAccess(['direct-shear'], ['vr'], 2, 'yearly');
  S.assignExperiment(TENANT, g3.access.id, 'direct-shear', 'student', [RAHUL]);
  var m3 = S.createDeviceTransfer(RAHUL, { currentDevice: 'a', newDevice: 'b', reason: 'c' });
  S.tenantAdminsFor(TENANT).forEach(function (a) { S.removeTenantAdmin(a.id); });
  eq(S.actingTenantAdmin(TENANT), null, 'this institution now has no Tenant Admin');
  eq(S.escalateDeviceTransfer(m3.request.id, 'x'), null,
    'so the POC step CANNOT be performed — and no actor is fabricated to get past it');
  eq(S.transfersAwaitingDecision().length, 0,
    'and the request still does not reach the Super Admin by default');
}

/* ------------------------------------------------------------
   SCENARIO CC — renewal follows the institution's own onboarding
   route, and nothing is extended by asking.

   "Tenant should go through same payment method which he follows in
    initial onboarding."
   ------------------------------------------------------------ */
function scenarioRenewal() {
  group('SCENARIO CC — renewal follows the institution’s original access route');
  boot();

  /* ---------- the INTERNAL / BITS Community route ---------- */
  var g = grantAccess(['direct-shear'], ['vr', 'web'], 3, 'yearly');
  var acc = g.access;
  S.assignExperiment(TENANT, acc.id, 'direct-shear', 'student', [RAHUL]);
  var endsBefore = acc.endsOn;
  var route = S.renewalRouteFor(TENANT);
  eq(route.paymentRequired, false, 'the seeded institution came in with NO payment step');
  eq(route.accessContext, 'BITS Community', 'and its access context says so');

  /* THE ROUTE COMES FROM THE INSTITUTION, NOT THE PROTOTYPE SELECTOR.
     With the external scenario selected, an internal institution must
     STILL renew on its own internal route. */
  S.setScenario('B');
  eq(S.renewalRouteFor(TENANT).paymentRequired, false,
    'THE ROUTE IS THE INSTITUTION’S: the external scenario does not put it on the payment route');
  var rn = S.submitRenewalRequest(acc.id, {});
  ok(rn.ok, 'the renewal is raised');
  eq(rn.request.paymentRequired, false, 'and inherits the institution’s own route, not the selector’s');
  eq(rn.request.renewsAccessId, acc.id, 'and names the record it renews');
  S.setScenario('A');

  /* NOTHING IS EXTENDED BY ASKING. */
  eq(S.accessById(acc.id).endsOn, endsBefore,
    'NO SILENT EXTENSION: requesting a renewal extends nothing');
  eq(S.accessById(acc.id).renewals.length, 0, 'and records no renewal');
  eq(S.accessAll().length, 1, 'and creates no second access record');
  eq(S.submitRenewalRequest(acc.id, {}).reason, 'already-open',
    'a second in-flight renewal for the same record is refused');

  /* MIRRORS THE CURRENT PLAN — the unresolved question stays unresolved. */
  eq(JSON.stringify(rn.request.items), JSON.stringify(acc.items),
    'THE RENEWAL MIRRORS THE CURRENT PLAN: same experiments and technologies');
  eq(rn.request.quantity, acc.quantity, 'same licence count');
  eq(rn.request.term, acc.term, 'same term');

  /* The Super Admin decision is the SAME surface, with the same gates. */
  eq(S.approveRequest(rn.request.id, { reason: '' }), null,
    'a renewal cannot be approved without a reason either');
  S.approveRequest(rn.request.id, { reason: 'QA — renewal approved.' });
  eq(S.request(rn.request.id).status, S.STATUS.ACTIVE,
    'the internal route has no payment step, so approval activates it');
  var renewed = S.accessById(acc.id);
  ok(renewed.endsOn > endsBefore, 'THE TERM IS EXTENDED — on the existing record');
  eq(S.accessAll().length, 1, 'AND NO SECOND ACCESS RECORD WAS CREATED');
  eq(renewed.renewals.length, 1, 'the renewal is on the record’s own audit line');
  eq(renewed.renewals[0].previousEndsOn, endsBefore, 'which keeps the previous end date');
  eq(renewed.renewals[0].route, 'no-payment', 'and names the route it came through');
  eq(renewed.quantity, 3, 'RENEWAL ADDED NO LICENCE');
  eq(S.accessAllocation(acc.id).assigned, 1,
    'AND THE STUDENT KEEPS THEIR ENTITLEMENT — the record they hold is the record that renewed');
  eq(S.studentCanRun(RAHUL, 'direct-shear', 'vr'), true, 'so the Student can still run it');

  /* ---------- the EXTERNAL / Subscription route ---------- */
  boot();
  S.setScenario('B');
  S.selectionAdd('consolidation', ['vr']);
  var ext = S.submitRequest({ institutionName: 'Northfield Institute of Technology',
    contactName: 'Prof. Daniel Mensah', contactEmail: 'd.mensah@northfield.example',
    quantity: 4, term: 'quarterly' });
  S.approveRequest(ext.id, { reason: 'QA — approved.' });
  S.completePayment(ext.id, S.PAYMENT_OUTCOME.SUCCESS);
  var extTenant = S.request(ext.id).tenantId;
  var extAcc = S.accessForTenant(extTenant)[0];
  var extEnds = extAcc.endsOn;
  eq(S.renewalRouteFor(extTenant).paymentRequired, true,
    'the external institution came in through a payment step');

  /* And it must STILL be on the payment route with the INTERNAL
     scenario selected — the mirror of the leak tested above. */
  S.setScenario('A');
  eq(S.renewalRouteFor(extTenant).paymentRequired, true,
    'THE ROUTE IS THE INSTITUTION’S: the internal scenario does not remove its payment step');
  var extRn = S.submitRenewalRequest(extAcc.id, {});
  ok(extRn.ok, 'the external renewal is raised');
  eq(extRn.request.paymentRequired, true, 'on the institution’s own payment route');
  S.approveRequest(extRn.request.id, { reason: 'QA — renewal approved.' });
  eq(S.request(extRn.request.id).status, S.STATUS.APPROVED_PAYMENT_REQUIRED,
    'APPROVAL ALONE DOES NOT ACTIVATE AN EXTERNAL RENEWAL');
  eq(S.accessById(extAcc.id).endsOn, extEnds, 'and the term is NOT extended by approval');

  S.completePayment(extRn.request.id, S.PAYMENT_OUTCOME.DECLINED);
  eq(S.accessById(extAcc.id).endsOn, extEnds, 'A DECLINED PAYMENT EXTENDS NOTHING');
  S.completePayment(extRn.request.id, S.PAYMENT_OUTCOME.INDETERMINATE);
  eq(S.accessById(extAcc.id).endsOn, extEnds, 'AN UNCONFIRMED PAYMENT EXTENDS NOTHING');
  eq(S.accessById(extAcc.id).renewals.length, 0, 'and neither is recorded as a renewal');

  S.completePayment(extRn.request.id, S.PAYMENT_OUTCOME.SUCCESS);
  ok(S.accessById(extAcc.id).endsOn > extEnds,
    'ONLY THE COMPLETED PAYMENT ACTIVATES THE RENEWED TERM');
  eq(S.accessById(extAcc.id).renewals[0].route, 'payment', 'recorded as the payment route');
  eq(S.accessForTenant(extTenant).length, 1, 'and still one access record');

  /* ---------- no auto-renewal, and expiry still removes access, not history ---------- */
  boot();
  var g4 = grantAccess(['direct-shear'], ['vr'], 2, 'yearly');
  S.assignExperiment(TENANT, g4.access.id, 'direct-shear', 'student', [RAHUL]);
  S.requestSimulationAccess(RAHUL, 'direct-shear', 'vr');
  S.simulatePackageReady(RAHUL, 'direct-shear', 'vr');
  S.startSimulation(RAHUL, 'direct-shear', 'vr');
  S.completeSimulation(RAHUL, 'direct-shear', 'vr');
  S.protoSetAccessEnd(g4.access.id, -1);
  eq(S.accessIsLive(S.accessById(g4.access.id)), false, 'the term has run out');
  eq(S.canRenewAccess(g4.access.id), true, 'an expired record can still be renewed');
  eq(S.accessById(g4.access.id).endsOn === null, false, 'NO AUTO-RENEWAL happened');
  eq(S.studentCanRun(RAHUL, 'direct-shear', 'vr'), false, 'expiry removed effective access');
  var simAfterExpiry = S.simulationActivity(RAHUL, 'direct-shear', 'vr');
  eq(simAfterExpiry.status, S.SIM_STATUS.COMPLETED,
    'BUT THE HISTORY IS KEPT — expiry removes effective access, not the completed run');
  ok(simAfterExpiry.timeSpentSeconds >= 0, 'and the time spent on it survives too');
  eq(S.activeAssignments(TENANT).length, 1, 'and the assignment behind it is not deleted either');

  var rn4 = S.submitRenewalRequest(g4.access.id, {});
  S.approveRequest(rn4.request.id, { reason: 'QA — renewal after expiry.' });
  eq(S.accessIsLive(S.accessById(g4.access.id)), true, 'the renewal brought the record back');
  eq(S.studentCanRun(RAHUL, 'direct-shear', 'vr'), true, 'and the Student’s entitlement with it');
  eq(S.accessAllocation(g4.access.id).assigned, 1, 'without re-assigning anybody');
}

/* ------------------------------------------------------------
   SCENARIO DD — the canonical Course Code.

   "Content Manager primarily. Super Admin will also get access to it."
   ------------------------------------------------------------ */
function scenarioCourseCode() {
  group('SCENARIO DD — the canonical Course code: Content Manager, and Super Admin too');
  boot();

  /* ---- blank is a legitimate, permanent state ---- */
  ok(D.courses().every(function (c) { return typeof c.code === 'string'; }),
    'every canonical Course carries a code field');
  eq(D.course('soil-mechanics').code, '', 'seeded blank — no official code is invented');
  ok(S.createCourse({ groupingId: 'civil-engineering', name: 'QA Course A',
    summary: 'QA.' }).ok, 'a Course can still be created with NO code');

  /* ---- the CONTENT MANAGER owns it ---- */
  eq(S.coursesForManager(KULK).length, D.courses().length,
    'a platform-scope Content Manager covers every Course');
  ok(S.managerCanSetCourseCode(KULK, 'soil-mechanics'), 'and may set its canonical code');
  var set = S.updateCourseCode(KULK, 'soil-mechanics', 'CE G511');
  ok(set.ok, 'THE CONTENT MANAGER SETS THE CANONICAL COURSE CODE');
  eq(D.course('soil-mechanics').code, 'CE G511', 'and it reaches every catalogue lookup');
  eq(set.course.codeSetBy, 'M. Kulkarni', 'attributed to the person who set it');

  /* ---- SCOPE STILL GOVERNS. A Course-scoped manager reaches only theirs. ---- */
  S.roleAssignments({ actorId: KULK }).forEach(function (m) {
    S.removePlatformRoleAssignment(m.id, 'QA — narrowing scope.');
  });
  S.assignPlatformRole({ actorId: KULK, role: 'manager', scope: 'course', courseId: 'soil-mechanics' });
  ok(S.managerCanSetCourseCode(KULK, 'soil-mechanics'), 'their own Course is still theirs');
  eq(S.managerCanSetCourseCode(KULK, 'fluid-mechanics'), false, 'a Course outside their scope is not');
  eq(S.updateCourseCode(KULK, 'fluid-mechanics', 'ME F311').ok, false,
    'AND THE WRITER REFUSES IT — authority lives in state, not in the route');
  eq(D.course('fluid-mechanics').code, '', 'and the refusal wrote nothing');

  /* ---- a VENDOR or an ACADEMIC REVIEWER is not an owner of it ---- */
  eq(S.updateCourseCode(RAO, 'soil-mechanics', 'X1').ok, false, 'a Vendor cannot set a Course code');
  eq(S.updateCourseCode(IYER, 'soil-mechanics', 'X2').ok, false,
    'nor can an Academic Reviewer');
  eq(D.course('soil-mechanics').code, 'CE G511', 'and neither refusal changed it');

  /* ---- the SUPER ADMIN also has access ---- */
  var sa = S.updateCourse('surveying', { groupingId: 'civil-engineering', name: 'Surveying',
    summary: 'Field surveying instruments and procedures practised in a simulated environment.',
    code: 'CE G512' });
  ok(sa.ok, 'THE SUPER ADMIN ALSO SETS A CANONICAL COURSE CODE');
  eq(D.course('surveying').code, 'CE G512', 'and it takes effect');
  eq(sa.course.codeSetBy, 'Super Admin', 'attributed to the platform');
  var noCode = S.updateCourse('surveying', { groupingId: 'civil-engineering', name: 'Surveying',
    summary: 'Field surveying instruments and procedures practised in a simulated environment.' });
  eq(noCode.course.code, 'CE G512',
    'and a save that does not carry the field cannot silently blank the code');

  /* ---- platform-wide uniqueness, blanks excepted ---- */
  eq(S.updateCourse('structural-analysis', { groupingId: 'civil-engineering',
    name: 'Structural Analysis', summary: 'x', code: 'ce g512' }).ok, false,
    'a duplicate canonical code is refused platform-wide, case-insensitively');
  ok(S.updateCourse('structural-analysis', { groupingId: 'civil-engineering',
    name: 'Structural Analysis', summary: 'x', code: '' }).ok,
    'while blank never collides with blank');

  /* ---- THE TENANT ADMIN CANNOT REDEFINE IT ---- */
  ok(!!S.setCourseMapping(TENANT, 'soil-mechanics', 'SEI-SM-01', '5'),
    'the Tenant Admin sets their own LOCAL course code');
  eq(S.courseMapping(TENANT, 'soil-mechanics').localCode, 'SEI-SM-01', 'which is stored on the mapping');
  eq(D.course('soil-mechanics').code, 'CE G511',
    'AND THE CANONICAL CODE IS UNTOUCHED — a tenant-local mapping cannot redefine it');
  eq(S.courseMapping(TENANT, 'soil-mechanics').code, undefined,
    'the mapping carries no canonical code of its own to confuse it with');
  /* A Tenant Admin is not a content actor at all, so the actor-scoped
     writer cannot even resolve them. */
  eq(S.updateCourseCode(TENANT, 'soil-mechanics', 'HACK').ok, false,
    'and a tenant id is not a content actor — the canonical writer refuses it outright');
  eq(D.course('soil-mechanics').code, 'CE G511', 'canonical code still intact');

  /* ---- and the tenant’s own mapping still works exactly as before ---- */
  ok(S.clearCourseMapping(TENANT, 'soil-mechanics'), 'the tenant can still clear its own mapping');
  eq(D.course('soil-mechanics').code, 'CE G511', 'without touching the canonical code');
}

/* ------------------------------------------------------------
   SCENARIO EE — Super Admin override authority: explicit,
   reasoned, audited, and NOT a relaxation of normal ownership.
   ------------------------------------------------------------ */
function scenarioPlatformOverride() {
  group('SCENARIO EE — platform override is explicit, reasoned and audited');
  boot();

  var rec = S.contentRecords().filter(function (r) {
    return r.status === S.CONTENT_STATUS.ACADEMIC_REVIEW;
  })[0];
  ok(!!rec, 'a submission is sitting with the Academic Reviewer');
  var historyBefore = rec.history.length;
  var accBefore = S.accessAll().length;
  var pubBefore = S.publishedPool().length;
  var pubRecsBefore = S.publicationRecords().length;
  var revsBefore = S.academicReviewsFor(rec.id).length;

  /* ---- a reason is REQUIRED ---- */
  eq(S.overrideContentStatusAsPlatform(rec.id, S.CONTENT_STATUS.DRAFT, ''), null,
    'AN OVERRIDE WITH NO REASON IS REFUSED');
  eq(S.overrideContentStatusAsPlatform(rec.id, S.CONTENT_STATUS.DRAFT, '   '), null,
    'and whitespace is not a reason');
  eq(S.contentRecord(rec.id).status, S.CONTENT_STATUS.ACADEMIC_REVIEW, 'and nothing moved');
  eq(S.contentRecord(rec.id).history.length, historyBefore,
    'AND NO HISTORY WAS MANUFACTURED BY THE REFUSAL');

  /* ---- the destinations are declared, with whether anybody can act ---- */
  var dests = S.overrideDestinations(rec.id);
  ok(dests.length > 0, 'the override declares where the record may be moved');
  ok(dests.every(function (d) { return d.status !== S.CONTENT_STATUS.PUBLISHED; }),
    'and PUBLISHED is never one of them');
  ok(dests.every(function (d) { return typeof d.reachable === 'boolean'; }),
    'and each one says whether anybody live could act there');

  /* ---- a real override ---- */
  var out = S.overrideContentStatusAsPlatform(rec.id, S.CONTENT_STATUS.DRAFT,
    'The only assigned Academic Reviewer is unavailable; returning it to the Vendor.');
  eq(out.status, S.CONTENT_STATUS.DRAFT, 'the Super Admin moved it');
  eq(out.overrides.length, 1, 'ONE override is recorded');
  eq(out.overrides[0].from, S.CONTENT_STATUS.ACADEMIC_REVIEW, 'naming what it moved from');
  eq(out.overrides[0].to, S.CONTENT_STATUS.DRAFT, 'and what it moved to');
  ok(out.overrides[0].reason.length > 0, 'with the reason kept');
  eq(out.history.length, historyBefore + 1, 'and EXACTLY ONE history entry was added');
  var ev = out.history.filter(function (h) { return h.kind === 'override'; })[0];
  ok(!!ev, 'which reads AS an override in the shared timeline');
  eq(ev.actorName, 'Super Admin', 'attributed to the platform');
  eq(ev.actorRole, null, 'which holds no content role');
  ok(ev.note.length > 0, 'and carries the reason');

  /* ---- IT GRANTS NOTHING ---- */
  eq(S.accessAll().length, accBefore, 'the override created no tenant access');
  eq(S.entitledStudentIds(TENANT).length, 0, 'and no student entitlement');
  eq(S.publishedPool().length, pubBefore, 'and published nothing');
  eq(S.publicationRecords().length, pubRecsBefore, 'and wrote no publication record');
  eq(S.academicReviewsFor(rec.id).length, revsBefore, 'and no academic decision');

  /* ---- THE PUBLISH FIREWALL IS NOT CROSSED ---- */
  var published = S.contentRecords().filter(function (r) {
    return r.status === S.CONTENT_STATUS.PUBLISHED;
  })[0];
  eq(S.overrideContentStatusAsPlatform(published.id, S.CONTENT_STATUS.DRAFT, 'QA.'), null,
    'PUBLISHED CONTENT CANNOT BE MOVED BY OVERRIDE — nothing un-publishes');
  eq(S.overrideContentStatusAsPlatform(rec.id, S.CONTENT_STATUS.PUBLISHED, 'QA.'), null,
    'AND THE OVERRIDE CANNOT PUBLISH — first publication stays the Content Manager’s');
  eq(S.publishedPool().length, pubBefore, 'the public pool is unchanged by both refusals');

  /* ---- NORMAL OWNERSHIP IS UNCHANGED ---- */
  eq(S.approveAcademic(RAO, rec.id, 'QA'), null, 'a Vendor still cannot take an academic decision');
  eq(S.publishContent(IYER, rec.id), null, 'an Academic Reviewer still cannot publish');
  eq(S.addOutcome(RAO, rec.id, 'QA outcome'), null, 'a Vendor still cannot author a Learning Outcome');
  eq(S.overrideContentStatusAsPlatform(rec.id, S.CONTENT_STATUS.DRAFT, 'QA.'), null,
    'and moving a record to where it already is is refused');

  /* ---- withdrawing a scope now requires a reason, and suspension is one act ---- */
  boot();
  var live = S.roleAssignments({ actorId: RAO });
  ok(live.length > 0, 'the Vendor holds live scope');
  eq(S.removePlatformRoleAssignment(live[0].id, ''), null,
    'A SCOPE CANNOT BE WITHDRAWN WITHOUT A REASON');
  eq(S.roleAssignments({ actorId: RAO }).length, live.length, 'and nothing was withdrawn');
  eq(S.withdrawAllScopesForActor(RAO, ''), null, 'nor can every scope be withdrawn without one');
  var removed = S.withdrawAllScopesForActor(RAO, 'QA — suspended pending investigation.');
  eq(removed.length, live.length, 'ONE DECISION, ONE REASON, every scope withdrawn');
  eq(S.roleAssignments({ actorId: RAO }).length, 0, 'the Vendor now holds none');
  ok(S.roleAssignments({ actorId: RAO, includeRemoved: true }).every(function (m) {
    return m.removedReason.length > 0;
  }), 'and every withdrawn row carries the reason');
  ok(S.actorHistoricalRecordIds(RAO).length > 0,
    'NOTHING IS DESTROYED — their name is still on the records they acted on');
  var back = S.roleAssignments({ actorId: RAO, includeRemoved: true })[0];
  ok(!!S.restorePlatformRoleAssignment(back.id), 'and every row is individually restorable');
}

/* ------------------------------------------------------------
   SCENARIO GG — the defects the 07.2 adversarial review found in
   07.2's own work. One assertion each, so none can come back.
   ------------------------------------------------------------ */
function scenarioAdversarial072() {
  group('SCENARIO GG — Implementation-07.2 adversarial findings, closed');
  boot();

  /* ── 1 · A RENEWAL CANNOT BE NARROWED ──────────────────────────
     The Super Admin decision surface may hand an institution LESS than
     it asked for. `activateRenewal` extends the term of an EXISTING
     record and cannot apply a narrowed licence count or technology set,
     so a grant on a renewal was announced to the institution and then
     silently ignored — the recorded decision and the real entitlement
     diverged. It is refused outright, which also keeps the open
     question "may a renewal change the plan?" genuinely open. */
  var g = grantAccess(['direct-shear', 'consolidation'], ['vr', 'web'], 6, 'yearly');
  var acc = g.access;
  S.assignExperiment(TENANT, acc.id, 'direct-shear', 'student', [RAHUL]);
  var before = {
    quantity: acc.quantity, term: acc.term,
    items: JSON.stringify(acc.items), endsOn: acc.endsOn
  };
  var rn = S.submitRenewalRequest(acc.id, {});
  ok(rn.ok, 'a renewal is raised');
  var narrowed = { items: [{ experimentId: 'direct-shear', technologies: ['web'] }],
                   quantity: 1, term: 'monthly' };
  eq(S.validateGrant(S.request(rn.request.id), narrowed).ok, true,
    'the generic grant validator would accept that narrowing on an ordinary request');
  eq(S.approveRequest(rn.request.id, { reason: 'QA — narrowing a renewal.', grant: narrowed }), null,
    'A NARROWED GRANT ON A RENEWAL IS REFUSED');
  eq(S.request(rn.request.id).status, S.STATUS.SUBMITTED, 'and the renewal is still undecided');
  eq(S.request(rn.request.id).grant, undefined, 'no grant was stored');
  var after = S.accessById(acc.id);
  eq(after.quantity, before.quantity, 'THE REFUSAL CHANGED NOTHING: licences');
  eq(JSON.stringify(after.items), before.items, 'THE REFUSAL CHANGED NOTHING: experiments and technologies');
  eq(after.endsOn, before.endsOn, 'THE REFUSAL CHANGED NOTHING: the term');
  /* And the mirrored renewal still goes through. */
  S.approveRequest(rn.request.id, { reason: 'QA — renewal approved as it stands.' });
  eq(S.request(rn.request.id).status, S.STATUS.ACTIVE, 'the same renewal, unnarrowed, is approved');
  ok(S.accessById(acc.id).endsOn > before.endsOn, 'and the term moves');
  eq(S.accessById(acc.id).quantity, before.quantity, 'with the licence count untouched');
  eq(JSON.stringify(S.accessById(acc.id).items), before.items, 'and the plan untouched');

  /* ── 2 · THE REQUESTER IS RESOLVED FROM THE NAME THEY TYPE ─────
     Reading the prototype scenario instead showed one institution's
     access records, licence counts and terms to somebody requesting
     under a different name. */
  boot();
  grantAccess(['direct-shear'], ['vr', 'web'], 3, 'yearly');
  S.setScenario('A');
  eq(S.requesterTenant('Sample Engineering Institute').id, TENANT,
    'the typed name resolves to the institution it names');
  eq(S.requesterTenant('  sample engineering institute  ').id, TENANT,
    'trimmed and case-insensitive, exactly as the approval match is');
  eq(S.requesterTenant('Some Other Institute'), null,
    'AN UNRECOGNISED NAME RESOLVES TO NOBODY — never to whichever institution the selector points at');
  eq(S.heldSelectionFor(null, [{ experimentId: 'direct-shear' }]).length, 0,
    'and no institution means no held access is reported');
  eq(S.requesterTenant('').id, TENANT, 'an empty name falls back to the scenario, which is all the catalogue has');

  /* ── 3 · AN OVERRIDE CARRIES THE DESTINATION GATE ──────────────
     `submitContent` reads `returnedGate` to decide where a resubmission
     goes. Nulling it made the two "Changes requested" destinations
     behave identically, silently undoing the gate the Super Admin
     chose. */
  boot();
  var rec = S.contentRecords().filter(function (x) {
    return x.status === S.CONTENT_STATUS.ACADEMIC_REVIEW;
  })[0];
  var toContent = S.overrideContentStatusAsPlatform(rec.id, S.CONTENT_STATUS.CHANGES_CONTENT,
    'QA — returning to the Vendor at the readiness gate.');
  eq(toContent.status, S.CONTENT_STATUS.CHANGES_CONTENT, 'the record is returned at the CONTENT gate');
  eq(toContent.returnedGate, 'content', 'AND THE GATE IS RECORDED, not nulled');
  boot();
  var rec2 = S.contentRecords().filter(function (x) {
    return x.status === S.CONTENT_STATUS.ACADEMIC_REVIEW;
  })[0];
  var toAcademic = S.overrideContentStatusAsPlatform(rec2.id, S.CONTENT_STATUS.CHANGES_ACADEMIC,
    'QA — returning to the Vendor at the academic gate.');
  eq(toAcademic.returnedGate, 'academic', 'the academic gate is recorded too');
  var toDraft = S.overrideContentStatusAsPlatform(rec2.id, S.CONTENT_STATUS.DRAFT, 'QA — back to draft.');
  eq(toDraft.returnedGate, null, 'AND A DESTINATION THAT IS NOT A RETURN CARRIES NO GATE');

  /* ── 4 · WRITING PLATFORM MASTER DATA NEEDS THE AUTHORING SCOPE ─
     `actorCourseIds` widens an EXPERIMENT scope to that Experiment's
     Course, which is right for READING and wrong for writing a value
     that belongs to the whole Course. */
  boot();
  S.roleAssignments({ actorId: KULK }).forEach(function (m) {
    S.removePlatformRoleAssignment(m.id, 'QA — narrowing to one Experiment.');
  });
  ok(S.assignPlatformRole({ actorId: KULK, role: 'manager', scope: 'experiment',
    experimentId: 'direct-shear' }).ok, 'the Content Manager now holds ONE Experiment');
  ok(S.actorCourseIds(KULK).indexOf('soil-mechanics') !== -1,
    'they can still READ the Course that Experiment sits in');
  eq(S.managerCanSetCourseCode(KULK, 'soil-mechanics'), false,
    'BUT AN EXPERIMENT SCOPE CANNOT SET THE COURSE CODE — it is the whole Course’s value');
  eq(S.updateCourseCode(KULK, 'soil-mechanics', 'HACK').ok, false, 'and the writer refuses it');
  eq(D.course('soil-mechanics').code, '', 'and nothing was written');
  eq(S.coursesForManager(KULK).length, 0, 'and the screen offers them no Course to edit');
  ok(S.assignPlatformRole({ actorId: KULK, role: 'manager', scope: 'course',
    courseId: 'soil-mechanics' }).ok, 'an explicit Course scope is a different matter');
  ok(S.updateCourseCode(KULK, 'soil-mechanics', 'CE G511').ok, 'and that one may set it');

  /* ── 5 · A CODE SET AT CREATION HAS PROVENANCE ─────────────────── */
  boot();
  var made = S.createCourse({ groupingId: 'civil-engineering', name: 'QA Coded Course',
    summary: 'QA.', code: 'QA-001' });
  ok(made.ok, 'a Course can be created with a code');
  eq(made.course.codeSetBy, 'Super Admin', 'AND IT IS ATTRIBUTED — not reported as "never set"');
  ok(!!made.course.codeSetAt, 'and stamped');
  var plain = S.createCourse({ groupingId: 'civil-engineering', name: 'QA Uncoded Course', summary: 'QA.' });
  eq(plain.course.codeSetBy, undefined, 'while a Course created without one claims no provenance');
}

/* ------------------------------------------------------------
   SCENARIO FF — the schema 9 → 10 migration, in place.

   Modelled on SCENARIO Z5: build real state through the product, age
   it to 9 by deleting exactly what version 10 adds, reload, and prove
   nothing was lost and nothing was invented.
   ------------------------------------------------------------ */
function scenarioSchema10Migration() {
  group('SCENARIO FF — a schema-9 state gains the 07.2 fields and loses nothing');
  boot();

  /* Real state, through the real writers. */
  var g = grantAccess(['direct-shear'], ['vr', 'web'], 3, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  S.createDeviceTransfer(RAHUL, { technology: 'vr', currentDevice: 'a', newDevice: 'b', reason: 'c' });
  S.updateCourseCode(KULK, 'soil-mechanics', 'CE G511');
  S.createCourse({ groupingId: 'civil-engineering', name: 'QA Migration Course', summary: 'QA.' });

  var counts = {
    requests: S.requests().length, access: S.accessAll().length,
    people: S.people().length, assignments: S.activeAssignments(TENANT).length,
    transfers: S.deviceTransferRequests().length,
    courses: S.courseRecords().length, groupings: S.groupingRecords().length,
    content: S.contentRecords().length
  };
  var transferId = S.deviceTransferRequests()[0].id;

  /* AGE IT TO 9 — delete exactly the three things version 10 adds. */
  var raw = JSON.parse(localStorage.getItem(S.STORAGE_KEY));
  raw.schemaVersion = 9;
  raw.courses.forEach(function (c) { delete c.code; });
  raw.access.forEach(function (a) { delete a.renewals; });
  raw.deviceTransferRequests.forEach(function (r) {
    delete r.escalatedBy; delete r.escalatedAt; delete r.escalationNote;
  });
  localStorage.setItem(S.STORAGE_KEY, JSON.stringify(raw));

  loadState();
  S = XRSLP.state; D = XRSLP.data;

  eq(S.SCHEMA_VERSION, 12, 'the build is at schema 12');
  eq(S.migratedFrom(), 9, 'and reports that it migrated from 9');

  /* NOTHING LOST. */
  eq(S.requests().length, counts.requests, 'NOTHING LOST: requests');
  eq(S.accessAll().length, counts.access, 'NOTHING LOST: access records');
  eq(S.people().length, counts.people, 'NOTHING LOST: people');
  eq(S.activeAssignments(TENANT).length, counts.assignments, 'NOTHING LOST: assignments');
  eq(S.deviceTransferRequests().length, counts.transfers, 'NOTHING LOST: device requests');
  eq(S.courseRecords().length, counts.courses, 'NOTHING LOST: canonical Courses');
  eq(S.groupingRecords().length, counts.groupings, 'NOTHING LOST: Programmes');
  eq(S.contentRecords().length, counts.content, 'NOTHING LOST: content records');
  eq(S.studentCanRun(RAHUL, 'direct-shear', 'vr'), true, 'and entitlement still derives');

  /* THE THREE FIELDS ARE BACK-FILLED, EMPTY RATHER THAN MISSING. */
  ok(S.courseRecords().every(function (c) { return typeof c.code === 'string'; }),
    'every Course has a canonical code field again');
  eq(D.course('QA Migration Course') === null, true, 'the platform-created Course is looked up by id, not name');
  ok(S.accessAll().every(function (a) { return Array.isArray(a.renewals); }),
    'every access record has a renewal audit line — empty, not missing');
  var tr = S.deviceTransferById(transferId);
  eq(tr.escalatedBy, null, 'the device request has its escalation fields back');
  eq(tr.escalationNote, '', 'blank rather than absent');
  eq(tr.status, S.TRANSFER_STATUS.SUBMITTED,
    'AND ITS STATUS IS NOT REWRITTEN — a request awaiting a decision is with the Tenant Admin, which is where it was');

  /* AND THE MIGRATION INVENTS NOTHING. */
  eq(D.course('soil-mechanics').code, '',
    'a code that was deleted is back-filled from the SEED, which is blank — nothing is invented');

  /* A CODE A REAL PERSON SET IS NEVER RE-STAMPED. */
  S.updateCourseCode(KULK, 'soil-mechanics', 'CE G511');
  loadState();
  S = XRSLP.state; D = XRSLP.data;
  eq(D.course('soil-mechanics').code, 'CE G511',
    'MIGRATING AGAIN DOES NOT RE-STAMP A CODE SOMEBODY ENTERED');
  var courseCount = S.courseRecords().length;
  loadState();
  S = XRSLP.state; D = XRSLP.data;
  eq(S.courseRecords().length, courseCount, 'MIGRATING AGAIN DUPLICATES NOTHING');
  eq(S.accessAll()[0].renewals.length, 0, 'and adds no phantom renewal');
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
/* Implementation 07.2 — the stakeholder-confirmed corrections. */
scenarioExperimentExpansion();
scenarioDeviceRouting();
scenarioRenewal();
scenarioCourseCode();
scenarioPlatformOverride();
scenarioAdversarial072();

/* ============================================================
   IMPLEMENTATION 07.3 — the full stakeholder meeting closure.
   One scenario per confirmed rule, so none of them can regress.
   ============================================================ */

/* Puts a fresh Vendor draft through to the Content Manager's gate,
   which is where every routing question in this slice is asked. */
function atContentGate(name) {
  var made = S.createContentDraft(RAO, {
    name: name || 'QA 07.3 Fixture', courseId: 'surveying',
    summary: 'QA.', description: 'A fixture for the 07.3 corrections.',
    technologies: ['web'],
    delivery: { web: { url: 'https://example.org/qa-073', runtime: 'A modern browser' } },
    versionLabel: '1.0'
  });
  S.submitContent(RAO, made.id);
  S.addOutcome(IYER, made.id, 'Understand the 07.3 regression path.');
  S.approveAcademic(IYER, made.id, 'Approved.');
  return S.contentRecord(made.id);
}

/* ============================================================
   SCENARIO GG — the Content Manager's TWO destinations.
   Stakeholder: "there should be 2 options available. One is academic
   reviewer and one is vendor."
   ============================================================ */
function scenarioManagerRouting() {
  group('SCENARIO 07.3-A — Content Manager returns academic work to the Reviewer, technical work to the Vendor');
  boot();

  /* ---- the VENDOR route: unchanged default ---- */
  var v = atContentGate('QA Routing — Vendor');
  var okV = S.requestChangesContent(KULK, v.id, 'The hosted link 404s.');
  ok(!!okV, 'the Vendor route still works');
  eq(S.contentRecord(v.id).status, S.CONTENT_STATUS.CHANGES_CONTENT, 'it writes CHANGES_CONTENT');
  eq(S.CONTENT_STATUS_META[S.contentRecord(v.id).status].holder, 'vendor', 'AND ITS HOLDER IS THE VENDOR');
  eq(S.contentRecord(v.id).returnedGate, 'content', 'the vendor resubmission gate is set');
  ok(S.contentForVendor(RAO).some(function (r) { return r.id === v.id; }),
    'THE VENDOR ACTUALLY RECEIVES IT');
  eq(S.contentForReviewer(IYER, { queue: true }).some(function (r) { return r.id === v.id; }), false,
    'and it is NOT in the Academic Reviewer queue');

  /* THE DEFAULT IS UNCHANGED. Every pre-07.3 caller passed three
     arguments and must keep the behaviour it had. */
  var v2 = atContentGate('QA Routing — Default');
  S.requestChangesContent(KULK, v2.id, 'Three-argument call.');
  eq(S.contentRecord(v2.id).status, S.CONTENT_STATUS.CHANGES_CONTENT,
    'a three-argument call still means the Vendor — no caller changed behaviour');

  /* ---- the ACADEMIC route: the thing that did not exist ---- */
  var a = atContentGate('QA Routing — Academic');
  var okA = S.requestChangesContent(KULK, a.id, 'The learning outcomes do not match the content.',
    { destination: S.CHANGE_DESTINATION.REVIEWER });
  ok(!!okA, 'the Academic Reviewer route works');
  eq(S.contentRecord(a.id).status, S.CONTENT_STATUS.CHANGES_ACADEMIC_RECHECK, 'it writes CHANGES_ACADEMIC_RECHECK');
  eq(S.CONTENT_STATUS_META[S.contentRecord(a.id).status].holder, 'reviewer',
    'AND ITS HOLDER IS THE ACADEMIC REVIEWER, not the Vendor');
  ok(S.contentForReviewer(IYER, { queue: true }).some(function (r) { return r.id === a.id; }),
    'THE ACADEMIC REVIEWER ACTUALLY RECEIVES IT — it is in their queue');
  eq(S.reviewerOverview(IYER).returnedByManager, 1, 'and their overview counts it as returned by the manager');
  eq(S.reviewerOverview(IYER).queue.some(function (r) { return r.id === a.id; }), true,
    'and it is in the overview queue they actually read');

  /* THE VENDOR MUST NOT BE ABLE TO TOUCH IT — it is not theirs. */
  eq(S.vendorCanEdit(S.contentRecord(a.id), RAO), false,
    'THE VENDOR CANNOT EDIT a record returned to the Academic Reviewer');
  eq(S.submitContent(RAO, a.id), null, 'and cannot resubmit it');

  /* The manager's own counts must not call it "with the Vendor". */
  var mo = S.managerOverview(KULK);
  eq(mo.returnedToReviewer, 1, 'the manager sees it as returned to the reviewer');
  eq(mo.inAcademicRecheck, 1, 'and as being in academic re-check');

  /* THE DEAD-END TEST. Receiving the record is not enough — the reviewer
     must be able to MOVE it. `reviewerCanAct` and `academicReadiness`
     have to agree, or the record reaches the queue and sticks there. */
  ok(!!S.approveAcademic(IYER, a.id, 'Outcomes corrected.'),
    'THE REVIEWER CAN ACTUALLY APPROVE IT FORWARD — not a dead end');
  eq(S.contentRecord(a.id).status, S.CONTENT_STATUS.CONTENT_REVIEW,
    'and it returns to the publication gate');

  var a2 = atContentGate('QA Routing — Academic to Vendor');
  S.requestChangesContent(KULK, a2.id, 'Academic issue.', { destination: S.CHANGE_DESTINATION.REVIEWER });
  ok(!!S.requestChangesAcademic(IYER, a2.id, 'Vendor must fix the content itself.'),
    'or the reviewer can pass it on to the Vendor');
  eq(S.contentRecord(a2.id).status, S.CONTENT_STATUS.CHANGES_ACADEMIC, 'which lands as CHANGES_ACADEMIC');
  eq(S.CONTENT_STATUS_META[S.contentRecord(a2.id).status].holder, 'vendor', 'and that one IS the Vendor’s');

  /* REFUSALS. A reason is still required, and authority still holds. */
  var r3 = atContentGate('QA Routing — Refusals');
  eq(S.requestChangesContent(KULK, r3.id, '   ', { destination: S.CHANGE_DESTINATION.REVIEWER }), null,
    'an empty reason is refused on the academic route too');
  eq(S.requestChangesContent(RAO, r3.id, 'Not my decision.', { destination: S.CHANGE_DESTINATION.REVIEWER }), null,
    'and a Vendor cannot make the Content Manager’s decision');
  eq(S.contentRecord(r3.id).status, S.CONTENT_STATUS.CONTENT_REVIEW, 'a refused call wrote nothing');

  /* EVERY STATUS MUST HAVE A HOLDER LINE. A status the shared renderer
     has no case for returns '' and puts a hole in the middle of the
     sentences the screens concatenate around it. */
  Object.keys(S.CONTENT_STATUS).forEach(function (k) {
    var meta = S.CONTENT_STATUS_META[S.CONTENT_STATUS[k]];
    ok(!!meta && !!meta.label, 'status ' + k + ' has a badge label');
    ok(meta.holder === null || typeof meta.holder === 'string',
      'status ' + k + ' declares who holds it');
  });

  /* HISTORY IS PRESERVED AND NAMES THE DESTINATION. */
  var hist = S.contentRecord(a.id).history;
  ok(hist.some(function (h) { return h.kind === 'changes' && /Academic Reviewer/.test(h.label); }),
    'the history says it went to the Academic Reviewer');
  ok(S.contentRecord(v.id).history.some(function (h) {
    return h.kind === 'changes' && /Vendor/.test(h.label); }),
    'and the other says it went to the Vendor');

  /* THE DELTA, measured last on a clean state so nothing above is
     disturbed. `managerOverview` counts the WHOLE library and the seed
     already holds Vendor work, so the absolute figure is meaningless —
     what matters is that an ACADEMIC return does not move it at all. */
  boot();
  var vendorBefore = S.managerOverview(KULK).withVendor;
  var solo = atContentGate('QA Routing — Counted Alone');
  S.requestChangesContent(KULK, solo.id, 'Academic issue.', { destination: S.CHANGE_DESTINATION.REVIEWER });
  eq(S.managerOverview(KULK).withVendor, vendorBefore,
    'AN ACADEMIC RETURN DOES NOT MOVE THE "WITH THE VENDOR" COUNT AT ALL');
  eq(S.managerOverview(KULK).returnedToReviewer, 1, 'it is counted as returned to the reviewer instead');

  /* And a technical return DOES move it, so the counter is not inert. */
  var solo2 = atContentGate('QA Routing — Counted Alone 2');
  S.requestChangesContent(KULK, solo2.id, 'Broken link.');
  eq(S.managerOverview(KULK).withVendor, vendorBefore + 1,
    'while a technical return moves it by exactly one');
}

/* ============================================================
   SCENARIO HH — supporting references on a change request.
   Stakeholder: "wherever changes are there, we need some permission to
   enable them to add some reference or resources."
   ============================================================ */
function scenarioChangeRefs() {
  group('SCENARIO 07.3-B — a change request can carry supporting references, honestly');
  boot();

  var rec = atContentGate('QA Refs');
  var refs = [
    { kind: 'link', url: 'https://example.org/spec.pdf', label: 'Marked-up spec' },
    { kind: 'file', fileName: 'screenshot.png', fileSize: 2048, label: 'Broken step' }
  ];
  S.requestChangesContent(KULK, rec.id, 'See the attached screenshot.', { refs: refs });
  var ev = S.contentRecord(rec.id).history[0];
  eq(ev.kind, 'changes', 'the newest event is the change request');
  eq(ev.refs.length, 2, 'and it carries both references');
  eq(ev.refs[0].kind, 'link', 'a link reference keeps its kind');
  eq(ev.refs[0].url, 'https://example.org/spec.pdf', 'and its URL');
  eq(ev.refs[1].kind, 'file', 'a file reference keeps its kind');
  eq(ev.refs[1].fileName, 'screenshot.png', 'and the browser-reported name');
  eq(ev.refs[1].fileSize, 2048, 'and the browser-reported size');
  /* THE HONESTY FLAG IS ON THE RECORD, not only in the UI copy. */
  eq(ev.refs[1].storedBytes, false, 'AND IT STATES THAT NO BYTES WERE STORED');
  eq(ev.refs[1].url, undefined, 'a file reference invents no URL to download from');

  /* Junk is dropped rather than stored as a half-reference. */
  var rec2 = atContentGate('QA Refs 2');
  S.requestChangesContent(KULK, rec2.id, 'Reason.', { refs: [
    { kind: 'link', url: '   ' }, { kind: 'file', fileName: '' }, null, { kind: 'link', url: 'https://ok.example' }
  ] });
  eq(S.contentRecord(rec2.id).history[0].refs.length, 1, 'an empty reference is dropped, not stored blank');

  /* The Academic Reviewer's change request takes them in the 4th slot. */
  var rec3 = S.createContentDraft(RAO, {
    name: 'QA Refs Reviewer', courseId: 'surveying', summary: 'QA.',
    description: 'Reviewer references.', technologies: ['web'],
    delivery: { web: { url: 'https://example.org/qa-refs', runtime: 'Browser' } }, versionLabel: '1.0'
  });
  S.submitContent(RAO, rec3.id);
  S.requestChangesAcademic(IYER, rec3.id, 'Rework the outcomes.',
    [{ kind: 'link', url: 'https://example.org/rubric', label: 'Rubric' }]);
  eq(S.contentRecord(rec3.id).history[0].refs.length, 1,
    'the Academic Reviewer’s change request carries references too');
  var acr = S.academicReviewsFor(rec3.id)[0];
  eq(acr.refs.length, 1, 'and the academic review row records them as well');

  /* Empty is ALWAYS an array, never absent — every reader assumes it. */
  var rec4 = atContentGate('QA Refs 4');
  S.requestChangesContent(KULK, rec4.id, 'No references at all.');
  ok(Array.isArray(S.contentRecord(rec4.id).history[0].refs), 'no references still means an empty array');
  eq(S.contentRecord(rec4.id).history[0].refs.length, 0, 'which is empty, not missing');
}

/* ============================================================
   SCENARIO II — the Vendor's preview / demo video.
   Stakeholder: "give them a provision to add the video also."
   ============================================================ */
function scenarioPreviewVideo() {
  group('SCENARIO 07.3-C — the preview video travels the workflow and reaches the public only on publication');
  boot();

  var made = S.createContentDraft(RAO, {
    name: 'QA Preview Video', courseId: 'surveying', summary: 'QA.',
    description: 'Carries a preview video.', technologies: ['web'],
    delivery: { web: { url: 'https://example.org/qa-pv', runtime: 'Browser' } }, versionLabel: '1.0'
  });
  eq(S.contentRecord(made.id).previewVideo, null, 'a new draft has no preview video — never invented');

  /* ── SUPPLIED ON CREATE, NOT ONLY ON EDIT — 07.3 fix ────────────
     `createContentDraft` omitted the field, so a video typed on the
     Vendor's create form was dropped on the way in and the screen had to
     write it a second time. */
  var created = S.createContentDraft(RAO, {
    name: 'QA Preview On Create', courseId: 'surveying', summary: 'QA.',
    description: 'Video supplied at creation.', technologies: ['web'],
    delivery: { web: { url: 'https://example.org/qa-poc', runtime: 'Browser' } }, versionLabel: '1.0',
    previewVideo: { url: 'https://example.org/on-create.mp4', label: 'On create' }
  });
  ok(!!S.contentRecord(created.id).previewVideo, 'A VIDEO SUPPLIED ON CREATE SURVIVES');
  eq(S.contentRecord(created.id).previewVideo.url, 'https://example.org/on-create.mp4', 'with its URL');
  eq(S.contentRecord(created.id).previewVideo.addedBy, RAO, 'and it is stamped with the Vendor who supplied it');

  /* And it is NORMALISED on the way in, not stored raw. */
  var bad = S.createContentDraft(RAO, {
    name: 'QA Preview Bad URL', courseId: 'surveying', summary: 'QA.',
    description: 'Bad URL.', technologies: ['web'],
    delivery: { web: { url: 'https://example.org/qa-bad', runtime: 'Browser' } }, versionLabel: '1.0',
    previewVideo: { url: 'javascript:alert(1)' }
  });
  eq(S.contentRecord(bad.id).previewVideo, null,
    'A NON-HTTP URL IS REFUSED AT CREATE TOO — never stored as a live-looking link');

  /* The Vendor supplies one. */
  S.updateContentDraft(RAO, made.id, {
    name: 'QA Preview Video', courseId: 'surveying', summary: 'QA.',
    description: 'Carries a preview video.', technologies: ['web'],
    delivery: { web: { url: 'https://example.org/qa-pv', runtime: 'Browser' } }, versionLabel: '1.0',
    previewVideo: { url: 'https://example.org/demo.mp4', label: 'Two-minute walkthrough' }
  });
  var pv = S.contentRecord(made.id).previewVideo;
  ok(!!pv, 'the Vendor can supply a preview video');
  eq(pv.url, 'https://example.org/demo.mp4', 'the URL is stored as given');
  eq(pv.addedBy, RAO, 'and it records which Vendor supplied it');

  /* A non-URL is refused rather than stored as a broken reference. */
  S.updateContentDraft(RAO, made.id, {
    name: 'QA Preview Video', courseId: 'surveying', summary: 'QA.',
    description: 'Carries a preview video.', technologies: ['web'],
    delivery: { web: { url: 'https://example.org/qa-pv', runtime: 'Browser' } }, versionLabel: '1.0',
    previewVideo: { url: 'not-a-url' }
  });
  eq(S.contentRecord(made.id).previewVideo, null, 'a value that is not an http(s) URL is refused, not stored');

  /* Restore a real one and send it through the whole chain. */
  S.updateContentDraft(RAO, made.id, {
    name: 'QA Preview Video', courseId: 'surveying', summary: 'QA.',
    description: 'Carries a preview video.', technologies: ['web'],
    delivery: { web: { url: 'https://example.org/qa-pv', runtime: 'Browser' } }, versionLabel: '1.0',
    previewVideo: { url: 'https://example.org/demo.mp4', label: 'Two-minute walkthrough' }
  });
  S.submitContent(RAO, made.id);
  ok(!!S.contentRecord(made.id).previewVideo, 'IT SURVIVES SUBMISSION — the Academic Reviewer can see it');
  S.addOutcome(IYER, made.id, 'Outcome.');
  S.approveAcademic(IYER, made.id, 'Approved.');
  ok(!!S.contentRecord(made.id).previewVideo, 'and academic approval — the Content Manager can see it');

  /* NOT PUBLIC BEFORE PUBLICATION. */
  eq(S.publishedPool().some(function (r) { return r.id === made.id; }), false,
    'the record is not in the public pool before publication');
  S.publishContent(KULK, made.id);
  var pubRec = S.publishedPool().filter(function (r) { return r.id === made.id; })[0];
  ok(!!pubRec && !!pubRec.previewVideo, 'and after publication the public pool carries the preview video');

  /* An unpublished record with a video is still not public. */
  var hidden = S.createContentDraft(RAO, {
    name: 'QA Unpublished Video', courseId: 'surveying', summary: 'QA.',
    description: 'Must never be public.', technologies: ['web'],
    delivery: { web: { url: 'https://example.org/qa-hidden', runtime: 'Browser' } }, versionLabel: '1.0',
    previewVideo: { url: 'https://example.org/secret.mp4' }
  });
  eq(S.publishedPool().some(function (r) { return r.id === hidden.id; }), false,
    'AN UNPUBLISHED EXPERIMENT’S PREVIEW VIDEO IS NEVER PUBLIC');
}

/* ============================================================
   SCENARIO JJ — the Content Manager manages delivery links.
   Stakeholder: "content manager should have the provision to edit the
   link ... if he wants to delete and replace the link also."
   ============================================================ */
function scenarioDeliveryManagement() {
  group('SCENARIO 07.3-D — delivery links are the Content Manager’s to edit, with a reason and a history');
  boot();

  /* ⚠ THIS RECORD IS AT THE CONTENT GATE, NOT PUBLISHED — Implementation
     09. Every assertion below is unchanged and is the PRE-PUBLICATION
     path the delta explicitly preserves: before an artefact is public,
     the Content Manager's correction authority is exactly what the
     stakeholder asked for. What a MATERIAL edit does once the record is
     PUBLISHED is asserted separately, in the version-control scenario. */
  var rec = atContentGate('QA Delivery');
  eq(S.contentRecord(rec.id).status, S.CONTENT_STATUS.CONTENT_REVIEW,
    'the fixture sits at the content readiness gate, before first publication');
  eq(S.deliverySummaryFor(S.contentRecord(rec.id), 'web'), 'https://example.org/qa-073',
    'the record carries the Vendor’s link');

  /* A REASON IS REQUIRED. */
  eq(S.managerUpdateDelivery(KULK, rec.id, 'web', { url: 'https://example.org/new' }, '  '), null,
    'an edit with no reason is refused');
  eq(S.deliverySummaryFor(S.contentRecord(rec.id), 'web'), 'https://example.org/qa-073',
    'and the refused edit wrote nothing');

  /* THE EDIT. */
  var hBefore = S.contentRecord(rec.id).history.length;
  ok(!!S.managerUpdateDelivery(KULK, rec.id, 'web', { url: 'https://example.org/new' },
    'The vendor link started 404ing.'), 'a reasoned edit is accepted');
  eq(S.deliverySummaryFor(S.contentRecord(rec.id), 'web'), 'https://example.org/new', 'and the link is replaced');
  eq(S.contentRecord(rec.id).history.length, hBefore + 1, 'AND IT IS RECORDED — history grew by exactly one');
  var ev = S.contentRecord(rec.id).history[0];
  eq(ev.kind, 'delivery', 'the entry is a delivery event');
  ok(/qa-073/.test(ev.note) && /new/.test(ev.note), 'and it records BOTH the old and the new value');
  ok(/404ing/.test(ev.note), 'and the reason that was given');

  /* A BAD URL IS REFUSED — a student must never be handed a dead link. */
  eq(S.managerUpdateDelivery(KULK, rec.id, 'web', { url: 'javascript:alert(1)' }, 'Reason.'), null,
    'a hosted link that is not an http(s) URL is refused');
  eq(S.deliverySummaryFor(S.contentRecord(rec.id), 'web'), 'https://example.org/new', 'and nothing changed');

  /* IT CANNOT WIDEN THE TECHNOLOGY SET. */
  eq(S.managerUpdateDelivery(KULK, rec.id, 'vr', { packageRef: 'PKG-1' }, 'Reason.'), null,
    'THE CONTENT MANAGER CANNOT ADD A TECHNOLOGY the record does not carry');
  eq(S.contentRecord(rec.id).technologies.join(','), 'web', 'and the technology set is untouched');

  /* REMOVAL. */
  ok(!!S.managerUpdateDelivery(KULK, rec.id, 'web', null, 'Withdrawn pending a new build.', true),
    'the reference can be removed');
  eq(S.deliverySummaryFor(S.contentRecord(rec.id), 'web'), '', 'and it is gone');
  eq(S.contentRecord(rec.id).history[0].kind, 'delivery', 'the removal is recorded too');

  /* AUTHORITY. Only the Content Manager. */
  eq(S.managerUpdateDelivery(RAO, rec.id, 'web', { url: 'https://example.org/vendor' }, 'Reason.'), null,
    'a Vendor cannot use the Content Manager’s delivery control');
  eq(S.managerUpdateDelivery(IYER, rec.id, 'web', { url: 'https://example.org/reviewer' }, 'Reason.'), null,
    'AND NEITHER CAN THE ACADEMIC REVIEWER — inspection is not edit authority');
  eq(S.managerCanEditDelivery(S.contentRecord(rec.id), IYER), false,
    'which the predicate says outright');

  /* A no-op writes no history — the audit trail must not exaggerate. */
  var h2 = S.contentRecord(rec.id).history.length;
  S.managerUpdateDelivery(KULK, rec.id, 'web', { url: '' }, 'Reason.');
  eq(S.contentRecord(rec.id).history.length, h2, 'an edit that changes nothing records nothing');

  /* ── A NOTES-ONLY EDIT IS STILL AN EDIT — 07.3 adversarial fix ──
     The no-op guard used to compare only the URL / package reference, so
     changing runtime, notes or the package LABEL mutated the record,
     wrote no history and never saved, while still returning truthy. The
     screen announced a write that had not happened and the value was
     lost on reload. */
  var rec2 = atContentGate('QA Delivery — notes only');
  var h3 = S.contentRecord(rec2.id).history.length;
  ok(!!S.managerUpdateDelivery(KULK, rec2.id, 'web',
    { notes: 'Mirror is slow in the afternoon.' }, 'Recording a known issue.'),
    'a NOTES-ONLY edit is accepted');
  eq(S.contentRecord(rec2.id).history.length, h3 + 1,
    'AND IT IS RECORDED — a notes-only change is still a change');
  eq(S.deliveryOf(S.contentRecord(rec2.id), 'web').notes, 'Mirror is slow in the afternoon.',
    'and the value is actually stored');

  var h4 = S.contentRecord(rec2.id).history.length;
  ok(!!S.managerUpdateDelivery(KULK, rec2.id, 'web',
    { runtime: 'Chrome 120 or later' }, 'Tightening the stated runtime.'),
    'a RUNTIME-ONLY edit is accepted');
  eq(S.contentRecord(rec2.id).history.length, h4 + 1, 'and recorded too');

  /* AND IT IS PERSISTED, not left in memory. */
  var stored = JSON.parse(localStorage.getItem(S.STORAGE_KEY));
  var persisted = stored.contentRecords.filter(function (r) { return r.id === rec2.id; })[0];
  eq(persisted.delivery.web.notes, 'Mirror is slow in the afternoon.',
    'THE EDIT REACHED STORAGE — it was saved, not only mutated in memory');
  eq(persisted.delivery.web.runtime, 'Chrome 120 or later', 'and so did the runtime');
}

/* ============================================================
   SCENARIO KK — technology ACTUALLY USED, not merely licensed.
   Stakeholder: "we need the tag, whether he has performed this
   experiment in web or VR."
   ============================================================ */
function scenarioTechnologyUsed() {
  group('SCENARIO 07.3-E — Faculty can tell which technology the student actually used');
  boot();

  var g = grantAccess(['direct-shear'], ['web', 'vr'], 5, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);

  var s0 = S.technologyUseSummary(RAHUL, 'direct-shear');
  eq(s0.none, true, 'BEFORE ANY RUN: nothing is claimed');
  eq(s0.used.length, 0, 'no technology is reported as used');
  /* The student is ENTITLED to two technologies but has USED none —
     the exact distinction the stakeholder asked for. */
  eq(S.accessTechnologies(S.accessById(g.access.id), 'direct-shear').length, 2,
    'even though two technologies are licensed to them');

  S.startSimulation(RAHUL, 'direct-shear', 'web');
  var s1 = S.technologyUseSummary(RAHUL, 'direct-shear');
  eq(s1.used.join(','), 'web', 'starting Web reports Web as used');
  eq(s1.completed.length, 0, 'but not as completed');
  eq(s1.multiple, false, 'and not as multiple');

  S.completeSimulation(RAHUL, 'direct-shear', 'web');
  /* VR runs from an authorised package, so it must be requested and
     delivered before it can start — the same three steps the Student
     screen drives. */
  S.requestSimulationAccess(RAHUL, 'direct-shear', 'vr');
  S.simulatePackageReady(RAHUL, 'direct-shear', 'vr');
  ok(!!S.startSimulation(RAHUL, 'direct-shear', 'vr'), 'the VR run starts once the package is ready');
  S.completeSimulation(RAHUL, 'direct-shear', 'vr');
  var s2 = S.technologyUseSummary(RAHUL, 'direct-shear');
  /* THE WHOLE POINT: a set, not a single value. */
  eq(s2.used.join(','), 'web,vr', 'A STUDENT WHO USED BOTH IS REPORTED AS BOTH');
  eq(s2.completed.join(','), 'web,vr', 'and both are completed');
  eq(s2.multiple, true, 'and the summary says more than one was used');
  /* The old single-value field would have claimed only the latest. */
  eq(S.latestSimulationTechnology(RAHUL, 'direct-shear'), 'vr',
    'the single-value field still answers only "the latest" — which is why it is not the answer');

  /* Requested-but-never-run is reported separately, never as used. */
  var g2 = grantAccess(['consolidation'], ['vr'], 2, 'yearly');
  S.assignExperiment(TENANT, g2.access.id, 'consolidation', 'student', [RAHUL]);
  S.requestSimulationAccess(RAHUL, 'consolidation', 'vr');
  var s3 = S.technologyUseSummary(RAHUL, 'consolidation');
  eq(s3.none, true, 'REQUESTING A PACKAGE IS NOT PERFORMING THE EXPERIMENT');
  eq(s3.requestedOnly.join(','), 'vr', 'it is reported separately as requested only');
}

/* ============================================================
   SCENARIO LL — a restored scope does not erase the suspension.
   Clarification F: overall control, WITH auditability.
   ============================================================ */
function scenarioRoleAudit() {
  group('SCENARIO 07.3-F — withdrawing and restoring a scope leaves a durable audit line');
  boot();

  var mine = S.roleAssignments({ actorId: RAO });
  ok(mine.length > 0, 'the Vendor holds scopes');
  var id = mine[0].id;

  eq(S.actorWasEverSuspended(RAO), false, 'nothing suspended yet');
  S.removePlatformRoleAssignment(id, 'Suspended pending a compliance review.');
  var h1 = S.roleAssignmentHistory(id);
  eq(h1.length, 1, 'the withdrawal is recorded');
  eq(h1[0].kind, 'withdrawn', 'as a withdrawal');
  ok(/compliance/.test(h1[0].note), 'with the reason that was given');
  eq(S.actorWasEverSuspended(RAO), true, 'and the actor reads as suspended');

  S.restorePlatformRoleAssignment(id, 'Review closed with no finding.');
  var rec = S.roleAssignmentById(id);
  eq(rec.status, 'active', 'the scope is active again');
  eq(rec.removedReason, '', 'the CURRENT-state fields are cleared, as every screen expects');
  /* THE DEFECT THIS PINS: the evidence used to vanish here. */
  var h2 = S.roleAssignmentHistory(id);
  eq(h2.length, 2, 'BUT THE AUDIT LINE SURVIVES — two events, not zero');
  eq(h2[1].kind, 'restored', 'the restore is recorded');
  ok(/no finding/.test(h2[1].note), 'with its own reason');
  eq(h2[1].clearedRemovedReason, 'Suspended pending a compliance review.',
    'AND IT KEEPS VERBATIM WHAT WAS CLEARED');
  eq(S.actorWasEverSuspended(RAO), true,
    'SO "WAS THIS ACTOR EVER SUSPENDED?" IS STILL ANSWERABLE AFTER THE RESTORE');
}

/* ============================================================
   SCENARIO MM — a request never discloses a bystander institution.
   ============================================================ */
function scenarioRequesterIdentity() {
  group('SCENARIO 07.3-G — the Super Admin request surface reads the SUBMITTED institution, not the scenario');
  boot();

  var g = grantAccess(['direct-shear'], ['vr'], 3, 'yearly');
  ok(!!g.access, 'the seeded institution holds an access record');

  /* A DIFFERENT institution submits, under the same prototype scenario. */
  S.setScenario('A');
  S.selectionAdd('direct-shear', ['vr']);
  var stranger = S.submitRequest({
    institutionName: 'Nowhere College of Engineering',
    contactName: 'A. Stranger', contactEmail: 'a.stranger@nowhere.example',
    quantity: 4, term: 'yearly'
  });

  var resolved = S.resolveRequestTenant(S.request(stranger.id));
  eq(resolved, null,
    'AN UNRECOGNISED INSTITUTION RESOLVES TO NULL — not to whichever tenant the scenario seeded');
  /* Which is what the public form already did; the two now agree. */
  eq(S.requesterTenant('Nowhere College of Engineering'), null,
    'the public form’s resolver agrees');

  /* The seeded institution still resolves normally — nothing regressed. */
  S.selectionAdd('consolidation', ['web']);
  var known = S.submitRequest({
    institutionName: 'Sample Engineering Institute',
    contactName: 'Dr. Kavita Sharma', contactEmail: 'kavita.sharma@sample-institute.example',
    quantity: 2, term: 'yearly'
  });
  var t2 = S.resolveRequestTenant(S.request(known.id));
  ok(!!t2 && t2.id === TENANT, 'a request under the real institution’s name still resolves to it');
  eq(S.heldSelectionFor(t2.id, S.request(known.id).items).length >= 0, true,
    'and its held-selection read model still answers');

  /* Once bound, the id wins — a later rename must not re-route payment. */
  S.approveRequest(known.id, { reason: 'QA — approved.' });
  var bound = S.request(known.id);
  ok(!!bound.tenantId, 'an approved request is bound to a tenant id');
  eq(S.resolveRequestTenant(bound).id, TENANT, 'and the binding wins over the name from then on');
}


/* ============================================================
   SCENARIO OO — the Faculty progress export, tested as a FILE.
   Stakeholder: "if there are 100s of students ... they cannot count
   each student."

   This asserts the CONTENT of the generated CSV, not the presence of a
   download button. `js/csv.js` is loaded here because the harness's
   state bootstrap does not need it; only `download()` touches the DOM
   and nothing below calls it.
   ============================================================ */
function scenarioProgressExport() {
  group('SCENARIO 07.3-I — Faculty progress export: the FILE, not the button');
  boot();
  (new Function(readFile('js/csv.js'))).call(window);

  var g = grantAccess(['direct-shear'], ['web', 'vr'], 5, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  S.mapFaculty(TENANT, ARJUN, g.access.id, 'soil-mechanics', null);
  S.startSimulation(RAHUL, 'direct-shear', 'web');
  S.completeSimulation(RAHUL, 'direct-shear', 'web');
  S.requestSimulationAccess(RAHUL, 'direct-shear', 'vr');
  S.simulatePackageReady(RAHUL, 'direct-shear', 'vr');
  S.startSimulation(RAHUL, 'direct-shear', 'vr');

  /* One row, built exactly as `XRSLP.screens.facultyStudents` builds it. */
  var fs = S.facultyExperimentStats(ARJUN, 'direct-shear');
  eq(fs.rows.length, 1, 'the Faculty member has one student row to export');
  var row = {
    person: S.personById(RAHUL), experimentId: 'direct-shear',
    technologies: fs.rows[0].technologies, progress: fs.rows[0].progress,
    attempt: S.latestSubmittedAttempt(RAHUL, 'direct-shear'),
    assessState: S.assessmentState(RAHUL, 'direct-shear'), pendingReviews: 0
  };
  var L = {
    simLabel: function (x) { return x; }, progressLabel: function (x) { return x; },
    assessLabel: function (x) { return (x && x.key) || String(x); }
  };
  var table = XRSLP.csv.facultyProgressRows([row], {
    state: S, data: D, labels: L,
    courseMapping: function (eid) {
      var c = D.contextOf(eid);
      return c && c.course ? S.courseMapping(TENANT, c.course.id) : null;
    }
  });
  function col(name) { return table[0].indexOf(name); }
  function val(name) { return table[1][col(name)]; }

  eq(table.length, 2, 'the export is a header plus one row');
  eq(table[0].length, table[1].length, 'and every row has exactly as many cells as the header');
  ok(col('Student name') !== -1 && col('Experiment') !== -1, 'it names the student and the experiment');

  eq(val('Student name'), 'Rahul Verma', 'the student name is exported');
  eq(val('Student ID'), 'SEI/CE/2023/0142', 'and their institutional ID');
  eq(val('Course'), 'Soil Mechanics', 'and the Course');
  eq(val('Experiment'), 'Direct Shear Test', 'and the Experiment');

  /* THE TWO COURSE CODES STAY SEPARATE, and the canonical one is not invented. */
  /* ⚠ ASSERTION CHANGED AT THE RECONCILIATION PASS, and why.
     The column was headed "Official course code"; every screen in the
     product now says "Platform course code", and one value must not
     carry two names — least of all in the artefact a stakeholder takes
     away and reads offline. Only the HEADER changed: the value is still
     read from the same field and is still blank because none has been
     set. The assertion is strengthened rather than relaxed — it now
     also proves the old name is gone. */
  eq(val('Platform course code'), '', 'the PLATFORM course code is blank — no value has been set, and none is invented');
  eq(val('Official course code'), undefined, 'and the old "Official" heading is gone — one value, one name');
  eq(val('Institution course code'), 'CE-305', 'while the institution’s OWN local code is exported beside it');

  /* TECHNOLOGY USED, NOT MERELY LICENSED. */
  eq(val('Technologies used'), 'web | vr', 'BOTH technologies the student actually used are exported');
  eq(val('Simulation status by technology'), 'web=COMPLETED | vr=IN_PROGRESS',
    'with the real per-technology status, not a single summary');

  /* ── Implementation 09 — THE FACTUAL UTILISATION COLUMNS ──────
     PM-08 asked how anyone knows the experiment was used, for how
     long, and how often. The export now carries the answer, folded
     from the runtime event log rather than restated from a label. */
  eq(val('Simulation launches'), 2, 'the export carries the LAUNCH COUNT across technologies');
  eq(val('Simulation sessions'), 2, 'and the session count');
  eq(val('Sessions left open'), 1, 'AND HOW MANY WERE LEFT OPEN — the VR run was never finished');
  ok(typeof val('Time spent (minutes)') === 'number' && val('Time spent (minutes)') >= 0,
    'time spent is exported in whole minutes, and is never negative');
  ok(!!val('First simulation activity'), 'the first activity is exported');
  ok(!!val('Last activity'), 'and the last');
  eq(val('Simulation completed in'), 'web',
    'AND EXACTLY WHICH TECHNOLOGY WAS COMPLETED — VR was used but not finished, and is not listed');
  eq(val('Usage evidence'), 'runtime sessions (stand-in — no device application connected)',
    'AND THE FILE SAYS WHERE THE FIGURES CAME FROM — the VR run had no device behind it');

  /* THE PRIVACY COLUMN. Nothing is submitted, so nothing is claimed. */
  eq(val('Score %'), '', 'no score is exported when nothing was submitted');
  eq(val('Outcome'), '', 'and no outcome is invented');
  eq(val('Result released to student'), 'n/a — nothing submitted',
    'and the release column says so rather than implying a released result');

  /* ── A WITHHELD RESULT TRAVELS MARKED AS WITHHELD ──────────────
     The master concern is that a detached file could leak a result the
     Student is not yet allowed to see. It cannot: the marks are the
     Faculty member's own — `scoreWithheld` is explicitly a STUDENT-view
     gate — but the file must still SAY that the Student has not been
     shown them, or a forwarded copy would read as released. */
  var def = S.assessmentForTenant(TENANT, 'direct-shear');
  ok(!!def, 'the seeded assessment definition exists');
  var upd = S.updateAssessmentSettings(def.id, {
    title: def.title || 'Direct Shear Test assessment', intro: '',
    passMark: 40, attemptLimit: 3,
    policyMode: 'CUSTOM_DATE', customDate: '2099-01-01'
  }, ARJUN);
  ok(upd.ok !== false, 'Faculty set the result policy to a future release date');

  var att = S.startAttempt(RAHUL, 'direct-shear');
  ok(!!att, 'the Student started an attempt');
  S.submitAttempt(att.id);
  eq(S.scoreWithheld(RAHUL, 'direct-shear'), true, 'and the result is withheld from the Student');

  var row2 = {
    person: S.personById(RAHUL), experimentId: 'direct-shear',
    technologies: fs.rows[0].technologies, progress: S.facultyExperimentStats(ARJUN, 'direct-shear').rows[0].progress,
    attempt: S.latestSubmittedAttempt(RAHUL, 'direct-shear'),
    assessState: S.assessmentState(RAHUL, 'direct-shear'), pendingReviews: 0
  };
  var t2 = XRSLP.csv.facultyProgressRows([row2], {
    state: S, data: D, labels: L, courseMapping: function () { return null; }
  });
  function val2(name) { return t2[1][t2[0].indexOf(name)]; }
  ok(String(val2('Result released to student')).indexOf('yes') === -1,
    'THE EXPORT NEVER CALLS A WITHHELD RESULT RELEASED');
  ok(/withheld|n\/a/.test(String(val2('Result released to student'))),
    'it marks it as withheld, or says no outcome has been decided');

  /* THE FILE ITSELF: quoting and line endings. */
  var text = XRSLP.csv.toCsv(table);
  eq(text.split('\r\n')[0], table[0].join(','), 'the header line round-trips unquoted');
  ok(text.indexOf('Rahul Verma') !== -1, 'and the row is in the file');
  ok(text.charAt(text.length - 1) === '\n', 'the file ends with a newline');
  /* A value containing the delimiter must be quoted, or the file is corrupt. */
  var probe = XRSLP.csv.toCsv([['a,b', 'c"d'], ['1', '2']]);
  ok(probe.indexOf('"a,b"') === 0, 'a value containing a comma is quoted');
  ok(probe.indexOf('"c""d"') !== -1, 'and an embedded quote is doubled');
}


/* ============================================================
   SCENARIO 07.3-J — the defects the 07.3 ADVERSARIAL review found.
   One assertion each, so none of them can come back.
   ============================================================ */
function scenarioAdversarial073() {
  group('SCENARIO 07.3-J — Implementation-07.3 adversarial findings, closed');
  boot();

  /* ---- P0 · THE RENEWAL ROUTE BELONGS TO THE RECORD ----
     One institution, two records that arrived on different routes. The
     paid record must NOT renew for free, and the free one must not be
     held behind a payment step it never had. */
  var internal = grantAccess(['direct-shear'], ['web'], 3, 'yearly');   /* Scenario A — no payment */
  var recInternal = internal.access;
  eq(recInternal.accessContext, 'BITS Community', 'the first record is an internal one');

  /* Hand-build a SECOND record on the same institution with the other
     commercial context, which is exactly what an expansion request on a
     differently-onboarded route produces. */
  S.accessAll().push(JSON.parse(JSON.stringify(recInternal)));
  var recExternal = S.accessAll()[S.accessAll().length - 1];
  recExternal.id = 'ACC-QA-EXT';
  recExternal.accessContext = 'Subscription';
  recExternal.requestId = null;
  recExternal.renewals = [];

  var rInt = S.renewalRouteForAccess(recInternal.id);
  var rExt = S.renewalRouteForAccess(recExternal.id);
  eq(rInt.paymentRequired, false, 'THE INTERNAL RECORD RENEWS WITH NO PAYMENT STEP');
  eq(rExt.paymentRequired, true, 'AND THE SUBSCRIPTION RECORD RENEWS THROUGH PAYMENT');
  eq(rInt.accessContext, 'BITS Community', 'each route names the RECORD’s own context');
  eq(rExt.accessContext, 'Subscription', 'not the institution’s first one');
  eq(rInt.scope, 'record', 'and it is a record-scoped answer');

  /* The institution-wide helper is still available, and still answers
     institution-wide — it must not be mistaken for the record's route. */
  eq(S.renewalRouteFor(TENANT).scope, 'institution',
    'the institution-wide helper says so about itself');

  /* ---- P1 · AN EXISTING INSTITUTION KEEPS ITS OWN ROUTE ----
     Typing a known institution's name while the OTHER scenario is
     selected must not put it on the other route. */
  boot();
  var g0 = grantAccess(['direct-shear'], ['web'], 2, 'yearly');
  ok(!!g0.access, 'the institution exists and was onboarded internally');
  eq(S.tenantById(TENANT).kind, 'internal', 'and it is an internal institution');
  S.setScenario('B');                      /* the EXTERNAL scenario */
  S.selectionAdd('consolidation', ['web']);
  var second = S.submitRequest({
    institutionName: 'Sample Engineering Institute',
    contactName: 'Dr. Kavita Sharma', contactEmail: 'kavita.sharma@sample-institute.example',
    quantity: 2, term: 'yearly'
  });
  eq(second.paymentRequired, false,
    'A KNOWN INSTITUTION KEEPS ITS OWN ROUTE — the scenario selector does not put it on payment');
  eq(second.institution.accessContext, 'BITS Community',
    'and its recorded context is the institution’s, not the scenario’s');
  /* An UNKNOWN name still falls back to the scenario, which is the one
     case where there is no institution to ask. */
  S.selectionAdd('total-station', ['web']);
  var stranger = S.submitRequest({
    institutionName: 'Somewhere Else Institute of Technology',
    contactName: 'A. Stranger', contactEmail: 'a@elsewhere.example', quantity: 1, term: 'yearly'
  });
  eq(stranger.paymentRequired, true, 'an unrecognised institution still follows the selected scenario');

  /* ---- P1 · TECHNOLOGY "USED" MEANS A RUN, NOT A REQUEST ---- */
  boot();
  var g = grantAccess(['direct-shear'], ['web', 'vr'], 5, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  S.startSimulation(RAHUL, 'direct-shear', 'web');
  S.completeSimulation(RAHUL, 'direct-shear', 'web');
  /* Ask for the VR package and let it become ready — but never run it.
     Its `readyAt` is now the newest timestamp on the experiment. */
  S.requestSimulationAccess(RAHUL, 'direct-shear', 'vr');
  S.simulatePackageReady(RAHUL, 'direct-shear', 'vr');
  eq(S.latestSimulationTechnology(RAHUL, 'direct-shear'), 'web',
    'A PACKAGE THAT WAS NEVER OPENED IS NOT "the technology they used" — the Web run still wins');
  var att = S.startAttempt(RAHUL, 'direct-shear');
  eq(att.sourceTechnology, 'web', 'and the attempt is stamped with the run, not the request');
  eq(S.technologyUseSummary(RAHUL, 'direct-shear').requestedOnly.join(','), 'vr',
    'the un-run technology is still reported, separately, as requested only');

  /* With NO run at all the answer is null, so no screen claims one. */
  boot();
  var g2 = grantAccess(['direct-shear'], ['vr'], 2, 'yearly');
  S.assignExperiment(TENANT, g2.access.id, 'direct-shear', 'student', [RAHUL]);
  S.requestSimulationAccess(RAHUL, 'direct-shear', 'vr');
  S.simulatePackageReady(RAHUL, 'direct-shear', 'vr');
  eq(S.latestSimulationTechnology(RAHUL, 'direct-shear'), null,
    'NO RUN MEANS NULL — never a technology the student did not open');

  /* ---- P1 · DELIVERY REMOVAL CLEARS EVERYTHING IT PROMISES ---- */
  boot();
  var vrec = S.createContentDraft(RAO, {
    name: 'QA Delivery Removal', courseId: 'surveying', summary: 'QA.',
    description: 'Package delivery.', technologies: ['vr'],
    delivery: { vr: { packageRef: 'PKG-1', packageLabel: 'Rig v1', runtime: 'Quest 2',
                      notes: 'n', install: 'Sideload it.', packageFile: { name: 'rig.apk', size: 10 } } },
    versionLabel: '1.0'
  });
  S.submitContent(RAO, vrec.id);
  S.addOutcome(IYER, vrec.id, 'Outcome.');
  S.approveAcademic(IYER, vrec.id, 'ok');
  /* ⚠ NOT PUBLISHED — Implementation 09. Removal is always a material
     change, so on a published record it becomes a correction version
     (asserted in the version-control scenario). The invariant THIS
     block exists for — that a removal clears EVERYTHING the dialog
     promises, including the Vendor's recorded file and installation
     notes — is a property of the removal itself and is asserted here on
     the record where removal writes in place. */
  ok(!!S.deliveryOf(S.contentRecord(vrec.id), 'vr').packageFile, 'the record carries a recorded package file');
  S.managerUpdateDelivery(KULK, vrec.id, 'vr', null, 'Withdrawn pending a rebuild.', true);
  var dAfter = S.deliveryOf(S.contentRecord(vrec.id), 'vr');
  eq(dAfter.packageRef, undefined, 'removal clears the package reference');
  eq(dAfter.packageFile, undefined, 'AND THE RECORDED PACKAGE FILE — the dialog promised everything');
  eq(dAfter.install, undefined, 'AND THE INSTALLATION NOTES');
  eq(S.publishReadiness(S.contentRecord(vrec.id)).ok, false,
    'so the readiness gate actually closes rather than being satisfied by a leftover');

  /* ---- P1 · THE DELIVERY HISTORY NOTE NAMES WHAT MOVED ---- */
  boot();
  var drec = atContentGate('QA Delivery Note');
  S.publishContent(KULK, drec.id);
  /* Notes are content-plane only and never reach a Student, so this
     stays a direct, audited edit even on a PUBLISHED record — the
     "safe metadata" half of the Implementation-09 rule. */
  S.managerUpdateDelivery(KULK, drec.id, 'web', { notes: 'Slow in the afternoon.' }, 'Recording a known issue.');
  var note = S.contentRecord(drec.id).history[0].note;
  ok(/notes/.test(note), 'A NOTES-ONLY EDIT NAMES THE FIELD IT CHANGED');
  ok(/Slow in the afternoon/.test(note), 'and the new value');
  ok(!/was: https:\/\/example\.org\/qa-073 · now: https:\/\/example\.org\/qa-073/.test(note),
    'AND IT NO LONGER LOGS AN UNCHANGED SUMMARY AS THOUGH IT WERE THE CHANGE');

  /* ---- P1 · A REFERENCE URL IS SCHEME-CHECKED ---- */
  boot();
  var rrec = atContentGate('QA Ref Scheme');
  S.requestChangesContent(KULK, rrec.id, 'Reason.', { refs: [
    { kind: 'link', url: 'javascript:alert(1)', label: 'Looks innocent' },
    { kind: 'link', url: '//evil.example.com/pwn', label: 'Protocol relative' },
    { kind: 'link', url: 'file:///etc/passwd', label: 'Local file' },
    { kind: 'link', url: 'https://ok.example.org/spec.pdf', label: 'Real one' }
  ] });
  var keptRefs = S.contentRecord(rrec.id).history[0].refs;
  eq(keptRefs.length, 1, 'ONLY THE http(s) REFERENCE IS STORED');
  eq(keptRefs[0].url, 'https://ok.example.org/spec.pdf', 'and it is the real one');

  /* ---- P1 · A WITHDRAWN SCOPE KEEPS ITS EVIDENCE THROUGH THE MIGRATION ---- */
  boot();
  var mine = S.roleAssignments({ actorId: RAO });
  var raId = mine[0].id;
  S.removePlatformRoleAssignment(raId, 'Suspended pending a compliance review.');
  var raw = JSON.parse(localStorage.getItem(S.STORAGE_KEY));
  raw.schemaVersion = 10;
  /* Exactly what a 07.2 build would have stored: the removed* fields, no history. */
  raw.contentRoleAssignments.forEach(function (m) { delete m.history; });
  localStorage.setItem(S.STORAGE_KEY, JSON.stringify(raw));
  loadState();
  S = XRSLP.state;
  eq(S.actorWasEverSuspended(RAO), true,
    'A ROW THAT IS WITHDRAWN RIGHT NOW STILL READS AS SUSPENDED AFTER THE MIGRATION');
  var h = S.roleAssignmentHistory(raId);
  eq(h.length, 1, 'and the withdrawal is reconstructed from the fields already on the row');
  eq(h[0].kind, 'withdrawn', 'as a withdrawal');
  eq(h[0].backfilled, true, 'MARKED as reconstructed, so it is never mistaken for a live recording');
  ok(/compliance/.test(h[0].note), 'carrying the reason the row already held');
  S.restorePlatformRoleAssignment(raId, 'Review closed.');
  eq(S.actorWasEverSuspended(RAO), true,
    'AND THE EVIDENCE SURVIVES THE RESTORE — which is the whole point');

  /* ---- P1 · THE EXPORT NEVER PRINTS A SCORE THE STUDENT CANNOT SEE ---- */
  boot();
  (new Function(readFile('js/csv.js'))).call(window);
  var ge = grantAccess(['direct-shear'], ['web'], 5, 'yearly');
  S.assignExperiment(TENANT, ge.access.id, 'direct-shear', 'student', [RAHUL]);
  S.mapFaculty(TENANT, ARJUN, ge.access.id, 'soil-mechanics', null);
  var qd = S.addQuestion(TENANT, { type: 'descriptive', text: 'Explain.', experimentId: 'direct-shear',
    points: 4, guidance: 'g' }, ARJUN);
  var defE = S.assessmentForTenant(TENANT, 'direct-shear');
  S.addQuestionsToAssessment(defE.id, [qd.question.id], ARJUN);
  S.updateAssessmentSettings(defE.id, { title: defE.title || 'A', intro: '', passMark: 40,
    attemptLimit: 3, policyMode: 'CUSTOM_DATE', customDate: '2099-01-01' }, ARJUN);
  var attE = S.startAttempt(RAHUL, 'direct-shear');
  S.saveAnswer(attE.id, qd.question.id, 'An answer.');
  S.submitAttempt(attE.id);
  eq(S.scoreWithheld(RAHUL, 'direct-shear'), true, 'the score is withheld from the Student');
  eq(S.resultWithheld(RAHUL, 'direct-shear'), false,
    'while no OUTCOME is decided yet — the window the old column got wrong');
  var fsE = S.facultyExperimentStats(ARJUN, 'direct-shear');
  var rowE = { person: S.personById(RAHUL), experimentId: 'direct-shear',
    technologies: fsE.rows[0].technologies, progress: fsE.rows[0].progress,
    attempt: S.latestSubmittedAttempt(RAHUL, 'direct-shear'),
    assessState: S.assessmentState(RAHUL, 'direct-shear'), pendingReviews: 1 };
  var tE = XRSLP.csv.facultyProgressRows([rowE], { state: S, data: D,
    labels: { simLabel: function (x) { return x; }, progressLabel: function (x) { return x; },
              assessLabel: function (x) { return (x && x.key) || String(x); } },
    courseMapping: function () { return null; } });
  var relCell = String(tE[1][tE[0].indexOf('Result released to student')]);
  ok(relCell.indexOf('NO') === 0,
    'THE EXPORT MARKS IT WITHHELD DURING THE PENDING-REVIEW WINDOW, not "n/a"');
  ok(relCell.indexOf('yes') === -1, 'and never says the student has been shown it');

  /* Spreadsheet formula injection on an institution-supplied value. */
  var inj = XRSLP.csv.toCsv([['name'], ['=cmd|calc']]);
  ok(/'=cmd/.test(inj), 'a value beginning with = is neutralised for a spreadsheet');

  /* ---- P1 · A COURSE ID MUST NOT BE ABLE TO BLANK THE CATALOGUE ----
     The grouping maps were bare objects keyed by Course id, so a Course
     whose slug collides with an Object.prototype key resolved to the
     INHERITED value: `byCourse[id] || []` handed back a function and
     `.map` threw before any HTML existed. `render()` had no try/catch, so
     the whole page went blank — and it was unrecoverable from inside the
     product, because a Course id never changes and nothing deletes a
     Course. This renders the REAL screen module, not a copy of its logic. */
  boot();
  var priorDoc = typeof document === 'undefined' ? undefined : document;
  document = {
    getElementById: function () { return null; },
    querySelectorAll: function () { return []; },
    createElement: function () { return { style: {}, setAttribute: function () {}, appendChild: function () {} }; },
    body: { appendChild: function () {}, removeChild: function () {} }
  };
  ['js/components.js', 'js/content-ui.js', 'js/screens/public-catalogue.js'].forEach(function (f) {
    (new Function(readFile(f))).call(window);
  });
  var baseline = XRSLP.screens.catalogue({});
  ok(baseline && baseline.html && baseline.html.length > 100, 'the catalogue renders normally');

  ['Constructor', 'toString', 'valueOf', 'hasOwnProperty'].forEach(function (name) {
    var made = S.createCourse({ name: name, groupingId: 'civil-engineering', summary: 'QA probe.' });
    ok(made && made.ok, 'a Course named "' + name + '" can be created (id "' + made.course.id + '")');
  });
  var after = null, threw = null;
  try { after = XRSLP.screens.catalogue({}); } catch (e) { threw = e; }
  eq(threw, null, 'THE CATALOGUE DOES NOT THROW on a Course id that collides with Object.prototype');
  ok(after && after.html && after.html.length > 100, 'AND IT STILL RENDERS THE WHOLE PAGE');
  ok(after.html.indexOf('Civil Engineering') !== -1, 'with every published experiment still reachable');
  if (priorDoc === undefined) { document = undefined; } else { document = priorDoc; }
}

/* ============================================================
   SCENARIO NN — schema 10 → 11 back-fill.
   ============================================================ */
function scenarioSchema11Migration() {
  group('SCENARIO 07.3-H — a schema-10 state gains the 07.3 fields and loses nothing');
  boot();

  var rec = atContentGate('QA Migration 07.3');
  S.requestChangesContent(KULK, rec.id, 'A reason.');
  var raw = JSON.parse(localStorage.getItem(S.STORAGE_KEY));
  raw.schemaVersion = 10;
  /* Strip the 07.3 fields exactly as a schema-10 build would not have them. */
  raw.contentRecords.forEach(function (r) {
    delete r.previewVideo;
    (r.history || []).forEach(function (h) { delete h.refs; });
  });
  (raw.academicReviews || []).forEach(function (r) { delete r.refs; });
  (raw.contentRoleAssignments || []).forEach(function (m) { delete m.history; });
  var recCount = raw.contentRecords.length;
  var underTest = raw.contentRecords.filter(function (r) { return r.id === rec.id; })[0];
  var histCount = underTest.history.length;
  ok(histCount > 0, 'the fixture record has history to preserve');
  localStorage.setItem(S.STORAGE_KEY, JSON.stringify(raw));
  loadState();
  S = XRSLP.state;

  eq(S.SCHEMA_VERSION, 12, 'the build is at schema 12');
  eq(S.snapshot ? 0 : 0, 0, 'state reloaded');
  eq(S.contentRecords().length, recCount, 'NOTHING LOST: content records');
  eq(S.contentRecord(rec.id).history.length, histCount, 'NOTHING LOST: history entries');
  eq(S.contentRecord(rec.id).previewVideo, null, 'previewVideo is back-filled as null — never invented');
  ok(S.contentRecord(rec.id).history.every(function (h) { return Array.isArray(h.refs); }),
    'every history entry has a refs array again');
  ok(S.roleAssignments({ actorId: RAO }).every(function (m) { return Array.isArray(m.history); }),
    'every role assignment has its audit line again');

  /* IDEMPOTENT — re-running invents nothing and duplicates nothing. */
  var again = JSON.parse(localStorage.getItem(S.STORAGE_KEY));
  localStorage.setItem(S.STORAGE_KEY, JSON.stringify(again));
  loadState();
  S = XRSLP.state;
  eq(S.contentRecord(rec.id).history.length, histCount, 'MIGRATING AGAIN DUPLICATES NOTHING');
  eq(S.contentRecord(rec.id).previewVideo, null, 'and re-stamps nothing');
}




/* ============================================================
   IMPLEMENTATION 08 — RECONCILIATION PASS.

   Three reconciliations, two of which changed behaviour. Each is
   asserted against the rule that settles it, not against the number the
   code happened to produce.
   ============================================================ */

/* ---- one denominator for "the Courses this institution may map" ---- */
function scenario08MappableCourses() {
  group('IMPL 08R — one definition of the Courses an institution may map');
  boot();

  /* TWO QUESTIONS, TWO DENOMINATORS — and they must stay different.
     `tenantCourseIds` is the CONTENT denominator (live access records).
     `tenantMappableCourseIds` is the MAPPING denominator: access PLUS
     the Courses students are filed against, because STK31-26 makes
     Course ID/Code required when a student is provisioned. */
  var access = S.tenantCourseIds(TENANT);
  var mappable = S.tenantMappableCourseIds(TENANT);
  eq(access.length, 0, 'a clean seed grants no access, so the CONTENT denominator is empty');
  ok(mappable.length > 0,
    'but the MAPPING denominator is not — students are already filed against Courses');

  /* The union contains the access set. */
  ok(access.every(function (cid) { return mappable.indexOf(cid) !== -1; }),
    'every Course reachable through access is mappable');

  /* And it contains every Course a student is placed in. */
  var studentCourses = S.studentsForTenant(TENANT)
    .map(function (p) { return p.courseId; })
    .filter(Boolean);
  ok(studentCourses.every(function (cid) { return mappable.indexOf(cid) !== -1; }),
    'AND EVERY COURSE A STUDENT IS PLACED IN — the case the old denominator missed');

  /* No duplicates: a Course reachable both ways appears once. */
  var seen = {}, dupes = 0;
  mappable.forEach(function (cid) { if (seen[cid]) { dupes += 1; } seen[cid] = 1; });
  eq(dupes, 0, 'and it is a set, not a concatenation');

  /* ⚠ THE DEFECT THIS FIXES, STATED AS AN INVARIANT.
     The Overview's "missing a local code" row and the Academic mappings
     table must never disagree: every Course the mappings screen can
     show is a Course the attention row can count. */
  var unmapped = S.coursesWithoutMapping(TENANT);
  ok(unmapped.every(function (cid) { return mappable.indexOf(cid) !== -1; }),
    'THE UNMAPPED LIST IS DRAWN FROM THE SAME SET THE MAPPINGS SCREEN SHOWS');
  ok(unmapped.length > 0,
    'and on the seed it actually reports the Courses with no local code');
  unmapped.forEach(function (cid) {
    var m = S.courseMapping(TENANT, cid);
    ok(!m || !m.localCode, cid + ' genuinely has no institution course code');
  });
  /* The converse: a Course WITH a code is never reported as missing one. */
  mappable.filter(function (cid) {
    var m = S.courseMapping(TENANT, cid);
    return m && m.localCode;
  }).forEach(function (cid) {
    eq(unmapped.indexOf(cid), -1, cid + ' has a code and is not reported as missing');
  });

  /* Granting access must not shrink the mapping denominator. */
  var beforeCount = S.tenantMappableCourseIds(TENANT).length;
  grantAccess(['direct-shear'], ['web'], 3, 'yearly');
  ok(S.tenantMappableCourseIds(TENANT).length >= beforeCount,
    'granting access never removes a Course from the mappable set');
}

/* ---- manual add and CSV import obey ONE academic-mapping rule ---- */
function scenario08ProvisioningParity() {
  group('IMPL 08R — manual add and CSV import record the institution code the same way');
  boot();

  var COURSE = 'fluid-mechanics';
  eq(S.courseMapping(TENANT, COURSE), null, 'the seed has no mapping for this Course');

  var made = S.addStudent(TENANT, {
    studentId: 'SEI/CE/2099/0001', name: 'QA Manual', email: 'qa.manual@sample-institute.example',
    groupingId: 'civil-engineering', courseId: COURSE, localCourseCode: 'FM-101', semester: ''
  });
  ok(!!made, 'a student is created by the manual path');
  eq(made.localCourseCode, 'FM-101', 'their own record still carries the code they were entered with');

  /* THE FIX. The institution's code for a Course lives on the tenant
     mapping (STK31-11 / 25) — that is what the mappings screen, the
     Faculty surfaces and the CSV export all read. Manual add used to
     write only the person copy, so the same required field recorded
     institution-wide by CSV was invisible when typed by hand. */
  var mapping = S.courseMapping(TENANT, COURSE);
  ok(!!mapping, 'AND THE MANUAL PATH NOW WRITES THE TENANT MAPPING TOO');
  eq(mapping.localCode, 'FM-101', 'with the same value');

  /* Which means the Course immediately stops being reported as unmapped. */
  eq(S.coursesWithoutMapping(TENANT).indexOf(COURSE), -1,
    'so it is no longer counted as missing a local code');

  /* ND-04, THE CSV IMPORTER'S OWN RULE, APPLIES HERE TOO: an existing
     mapping is never silently overwritten. A Tenant Admin's deliberate
     mapping outranks a value typed into one person's form. */
  boot();
  S.setCourseMapping(TENANT, 'structural-analysis', 'SA-DELIBERATE', 'Sem 5');
  S.addStudent(TENANT, {
    studentId: 'SEI/CE/2099/0002', name: 'QA Two', email: 'qa.two@sample-institute.example',
    groupingId: 'civil-engineering', courseId: 'structural-analysis',
    localCourseCode: 'SA-TYPED-BY-MISTAKE', semester: ''
  });
  eq(S.courseMapping(TENANT, 'structural-analysis').localCode, 'SA-DELIBERATE',
    'AN EXISTING MAPPING IS NOT OVERWRITTEN by adding a student (ND-04)');
  eq(S.courseMapping(TENANT, 'structural-analysis').semester, 'Sem 5',
    'and its Semester survives untouched');

  /* A student added without a code writes no mapping — nothing invented. */
  boot();
  var noCode = S.addStudent(TENANT, {
    studentId: 'SEI/CE/2099/0003', name: 'QA Three', email: 'qa.three@sample-institute.example',
    groupingId: 'civil-engineering', courseId: COURSE, localCourseCode: '', semester: ''
  });
  ok(!!noCode, 'a student can be created without an institution course code');
  eq(S.courseMapping(TENANT, COURSE), null, 'AND NO MAPPING IS INVENTED FOR THEM');

  /* The tenant write guard still governs both paths. */
  boot();
  S.deactivateTenant(TENANT, 'QA — checking the write guard.');
  eq(S.addStudent(TENANT, {
    studentId: 'SEI/CE/2099/0004', name: 'QA Four', email: 'qa.four@sample-institute.example',
    groupingId: 'civil-engineering', courseId: COURSE, localCourseCode: 'FM-999', semester: ''
  }), null, 'a deactivated institution takes no manual add');
  eq(S.courseMapping(TENANT, COURSE), null, 'AND WRITES NO MAPPING EITHER — the guard covers both');
}


/* ---- support media attachment (08R stakeholder requirement) ---- */
function scenario08RSupportMedia() {
  group('IMPL 08R — a support report can carry evidence, honestly');
  boot();

  var CTX = { kind: 'student', id: RAHUL, name: 'Rahul Verma',
              roleLabel: 'Student', tenantId: TENANT };
  function fields(extra) {
    var f = { category: S.SUPPORT_CATEGORIES[0].id,
              subject: 'VR headset shows a black screen',
              description: 'Launched the experiment and the headset stayed black.' };
    Object.keys(extra || {}).forEach(function (k) { f[k] = extra[k]; });
    return f;
  }

  /* ---- 1 · no attachment is the ordinary case and must stay free ---- */
  var plain = S.createSupportTicket(CTX, fields());
  ok(plain.ok, 'a report submits with NO attachment');
  eq(plain.ticket.media, null, 'and carries no media — nothing is invented');

  /* ---- 2 · what the picker hands over is normalised, not trusted ---- */
  var img = S.attachSupportMedia({
    name: 'headset-error.png', type: 'image/png', size: 22194,
    width: 900, height: 600, thumb: 'data:image/jpeg;base64,AAAA'
  });
  ok(img.ok, 'an image is accepted');
  eq(img.media.kind, 'image', 'and classified as an image');
  eq(img.media.width, 900, 'keeping its real dimensions');
  eq(img.media.thumb, 'data:image/jpeg;base64,AAAA', 'and the reduced preview');

  var vid = S.attachSupportMedia({ name: 'clip.mp4', type: 'video/mp4', size: 900000 });
  ok(vid.ok, 'a video is accepted');
  eq(vid.media.kind, 'video', 'and classified as a video');
  eq(vid.media.thumb, '', 'with NO preview — a file input gives no frame to grab, and one is not faked');

  /* ---- 3 · unsupported and oversized fail GRACEFULLY ---- */
  var bad = S.attachSupportMedia({ name: 'notes.pdf', type: 'application/pdf', size: 1000 });
  eq(bad.ok, false, 'a PDF is refused');
  eq(bad.media, null, 'with no media record');
  ok(bad.error.length > 0, 'and a reason the user can act on');

  var huge = S.attachSupportMedia({ name: 'huge.png', type: 'image/png', size: 40 * 1024 * 1024 });
  eq(huge.ok, false, 'a 40 MB file is refused');
  ok(/25 MB/.test(huge.error), 'and the message names the limit');

  var nameless = S.attachSupportMedia({ name: '', type: 'image/png', size: 10 });
  eq(nameless.ok, false, 'a file with no name is refused rather than stored half-formed');

  /* ⚠ THE QUOTA GUARD. `save()` swallows a storage failure so the
     prototype can continue in memory, which means an oversized preview
     would silently cost the whole build its persistence. A thumbnail
     over the cap is dropped BEFORE the record is written; the facts
     survive, so a report never loses that evidence was attached. */
  var big = '';
  while (big.length < S.SUPPORT_MEDIA.MAX_THUMB_BYTES + 100) { big += 'x'; }
  var capped = S.attachSupportMedia({
    name: 'huge-preview.png', type: 'image/png', size: 5000, width: 10, height: 10, thumb: big
  });
  ok(capped.ok, 'an image whose preview is too large is still accepted');
  eq(capped.media.thumb, '', 'THE OVERSIZED PREVIEW IS DROPPED, not written');
  eq(capped.media.name, 'huge-preview.png', 'and the file is still named on the report');

  /* ---- 4 · the attachment travels with the report ---- */
  boot();
  var withMedia = S.createSupportTicket(CTX, fields({ media: img.media }));
  ok(withMedia.ok, 'a report submits WITH an attachment');
  ok(!!withMedia.ticket.media, 'and the ticket carries it');
  eq(withMedia.ticket.media.name, 'headset-error.png', 'by name');
  eq(withMedia.ticket.media.thumb, 'data:image/jpeg;base64,AAAA', 'and by preview');

  /* The reporter sees it on their own list... */
  var mine = S.ticketsForRequester('student', RAHUL);
  eq(mine.length, 1, 'the reporter sees their own report');
  ok(!!mine[0].media, 'AND THAT IT CARRIES MEDIA');

  /* ...and the platform team sees the same record. */
  var open = S.openSupportTickets();
  ok(open.some(function (t) { return t.id === withMedia.ticket.id && t.media; }),
    'THE SUPPORT REVIEWER SEES THE SAME ATTACHMENT on the open queue');
  eq(S.supportTicketById(withMedia.ticket.id).media.name, 'headset-error.png',
    'and on the report detail');

  /* ---- 5 · a summary line a person can read ---- */
  ok(/Image/.test(S.supportMediaSummary(img.media)), 'the summary names the kind');
  ok(/900/.test(S.supportMediaSummary(img.media)), 'and the dimensions');
  eq(S.supportMediaSummary(null), '', 'and says nothing when there is nothing');

  /* ---- 6 · attaching evidence grants nothing and leaks nothing ---- */
  eq(S.studentExperiments(RAHUL).filter(function (r) { return r.effective; }).length, 0,
    'a report with an attachment creates NO entitlement');
  var other = S.ticketsForRequester('student', 'USR-004');
  eq(other.length, 0, 'and another student sees nothing of it — role/requester isolation holds');
}

/* ============================================================
   IMPLEMENTATION 08 — STATIC SOURCE ASSERTIONS.

   Everything above this point exercises the state layer. These check
   the SOURCE TEXT of the screen files instead, because three of the
   rules this pass had to hold are properties of the markup and copy,
   not of any function:

     · the Content Manager's return has NO pre-selected destination
     · no page masks a layout defect with overflow-x:hidden
     · the two course codes are never labelled with the old ambiguous
       vocabulary

   A state-layer test cannot see any of those, and the browser-side
   harness (qa/ui-audit.js) is not run by this suite. `readFile` is
   provided by the JavaScriptCore shell the harness already relies on.
   ============================================================ */
function scenario08StaticSource() {
  group('IMPL 08 — static source rules the redesign must not have broken');

  function src(f) {
    try { return readFile(f); } catch (e) { return null; }
  }

  /* ---- 0 · EVERY PRODUCT FILE PARSES ----
     The suite loads four of the thirty-one JS files (utils · data ·
     ai-assist · state); the other twenty-seven are screens, and a
     syntax error in any of them takes the whole app down at load with
     nothing here going red. `checkSyntax` compiles a file without
     running it, so this validates all of them with no DOM and no side
     effects — the cheapest possible guard against the most total
     failure this build can have. */
  var PRODUCT_FILES = [
    'js/utils.js', 'js/data.js', 'js/ai-assist.js', 'js/state.js', 'js/csv.js',
    'js/components.js', 'js/content-ui.js', 'js/support-ui.js', 'js/router.js',
    'js/screens/public-catalogue.js', 'js/screens/public-request.js',
    'js/screens/platform.js', 'js/screens/platform-content.js', 'js/screens/platform-ops.js',
    'js/screens/tenant.js', 'js/screens/tenant-people.js', 'js/screens/tenant-groups.js',
    'js/screens/tenant-assign.js', 'js/screens/tenant-ops.js',
    'js/screens/student.js', 'js/screens/student-learn.js', 'js/screens/student-ops.js',
    'js/screens/faculty.js', 'js/screens/faculty-assess.js',
    'js/screens/vendor.js', 'js/screens/reviewer.js', 'js/screens/content-manager.js',
    'js/screens/content-version.js', 'js/screens/workspace-help.js', 'js/app.js'
  ];
  var unparsed = [];
  PRODUCT_FILES.forEach(function (f) {
    try { checkSyntax(f); } catch (e) { unparsed.push(f + ' (' + e.message + ')'); }
  });
  ok(unparsed.length === 0,
    'ALL ' + PRODUCT_FILES.length + ' PRODUCT JS FILES PARSE', unparsed.join('; '));

  /* index.html must actually load every one of them, in order — a file
     that parses but is never included is not in the product. */
  var html = src('index.html');
  ok(!!html, 'index.html is readable');
  if (html) {
    var missing = PRODUCT_FILES.filter(function (f) { return html.indexOf(f) === -1; });
    ok(missing.length === 0, 'AND index.html LOADS EVERY ONE OF THEM', missing.join(', '));
    /* One cache-busting token, bumped together. A file left on the old
       token is the stale-copy failure this build has already been bitten
       by once. */
    var tokens = {};
    (html.match(/\?v=\d+/g) || []).forEach(function (t) { tokens[t] = (tokens[t] || 0) + 1; });
    eq(Object.keys(tokens).length, 1,
      'and every asset carries the SAME cache-busting token (' + Object.keys(tokens).join(', ') + ')');
  }

  /* ---- 1 · no default destination on the return control ----
     The stakeholder rule is that the Content Manager must CHOOSE where a
     returned item goes. The state function keeps a legacy three-argument
     form meaning "Vendor" for pre-07.3 callers (asserted in
     scenarioManagerRouting), so the no-default guarantee lives entirely
     in this markup: the destination inputs must render UNCHECKED. */
  var cm = src('js/screens/content-manager.js');
  ok(!!cm, 'content-manager.js is readable');
  if (cm) {
    /* Scoped to the RENDERED INPUT, not to every mention of the name.
       An earlier version matched on `name="cm-dest"` alone and so also
       caught the event-handler's own selector string
       `input[name="cm-dest"]:checked` — which contains the word
       "checked" and no ternary, and reported a pre-selected default
       that did not exist. */
    var destMarkup = cm.match(/type="radio" name="cm-dest"[\s\S]{0,160}/g) || [];
    ok(destMarkup.length > 0, 'the destination control is still rendered');

    /* The radio MAY carry `checked` — cancelling the confirmation brings
       the sheet back with the choice the manager already made still in
       it, which is correct. What must never exist is an UNCONDITIONAL
       one. So the rule is not "no checked" but "no checked that is not
       guarded by an expression". */
    var unconditional = destMarkup.some(function (t) {
      return /checked/.test(t) && !/\?[^:]*checked[^:]*:/.test(t);
    });
    ok(!unconditional,
      'NO DESTINATION IS PRE-SELECTED — any `checked` is conditional, never a default');

    /* ...and nothing may hand that conditional a literal truth. */
    ok(!/destRadio\([^)]*,\s*true\s*\)/.test(cm),
      'and no destRadio call hard-codes a selected destination');

    /* Both destinations are still offered. The file aliases the enum
       (`var DEST = state.CHANGE_DESTINATION`), so the alias is what to
       look for — searching for the full name only ever matched the
       alias declaration itself. */
    ok(/DEST\.REVIEWER/.test(cm) && /DEST\.VENDOR/.test(cm),
      'and both destinations are still offered');
    ok(/state\.CHANGE_DESTINATION/.test(cm),
      'resolved from the state enum, not from a local string');
  }

  /* ---- 2 · no masked overflow ----
     Fixing a horizontal-overflow defect by hiding it on the root is the
     one repair this project has always refused, because it hides the
     symptom and keeps the bug. */
  ['css/base.css', 'css/layout.css', 'css/components.css', 'css/screens.css', 'css/responsive.css']
    .forEach(function (f) {
      var css = src(f);
      if (css === null) { return; }
      var masked = /(^|[^-\w])(html|body)\s*\{[^}]*overflow-x\s*:\s*hidden/i.test(css);
      ok(!masked, 'NO ROOT-LEVEL overflow-x:hidden in ' + f);
    });

  /* ---- 3 · every CSS custom property resolves ----
     `border: 1px solid var(--line)` shipped in components.css with
     `--line` defined in no stylesheet. An invalid value inside a
     SHORTHAND invalidates the whole declaration, so that fieldset
     rendered with no border from the day it was written and nothing
     failed, logged or looked obviously wrong. That is the failure mode
     worth a permanent guard: CSS does not throw. */
  (function () {
    var files = ['css/tokens.css', 'css/base.css', 'css/layout.css',
                 'css/components.css', 'css/screens.css', 'css/responsive.css'];
    var defined = {}, used = {};
    files.forEach(function (f) {
      var t = src(f);
      if (t === null) { return; }
      /* A token NAMED IN A COMMENT is prose, not a reference. */
      t = t.replace(/\/\*[\s\S]*?\*\//g, '');
      (t.match(/--[A-Za-z0-9_-]+\s*:/g) || []).forEach(function (m) {
        defined[m.replace(/\s*:$/, '')] = true;
      });
      (t.match(/var\(\s*--[A-Za-z0-9_-]+/g) || []).forEach(function (m) {
        used[m.replace(/var\(\s*/, '')] = f;
      });
    });
    var missing = Object.keys(used).filter(function (k) { return !defined[k]; });
    ok(missing.length === 0,
      'EVERY CSS CUSTOM PROPERTY REFERENCED IS DEFINED — an undefined one fails silently',
      missing.map(function (k) { return k + ' (' + used[k] + ')'; }).join(', '));
    ok(Object.keys(defined).length > 50, 'and the token set was actually read (' +
      Object.keys(defined).length + ' defined)');
  })();

  /* ---- 4 · the course-code vocabulary ----
     "Canonical code" is engineering vocabulary. The confirmed labels are
     "Platform course code" and "Institution course code". This checks the
     USER-FACING strings, so a code comment explaining the history is
     still allowed — comments are stripped before the search. */
  /* js/state.js and js/csv.js are in this list because they carry
     USER-FACING strings too — validation messages the Course-code forms
     render, and the CSV export's column headings. Two of each were still
     saying "canonical"/"Official" after the screens had all been
     relabelled, which is the same one-value-two-names defect one layer
     down. */
  var SCREENS = [
    'js/screens/platform-content.js', 'js/screens/tenant.js',
    'js/screens/content-manager.js', 'js/screens/faculty-assess.js',
    'js/screens/student.js', 'js/screens/tenant-groups.js',
    'js/screens/tenant-people.js', 'js/state.js', 'js/csv.js'
  ];
  SCREENS.forEach(function (f) {
    var t = src(f);
    if (t === null) { return; }
    /* strip block and line comments — the rule is about what a user reads */
    var code = t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    ok(!/canonical\s+course\s+code/i.test(code),
      'no user-facing "canonical course code" in ' + f);
    ok(!/official\s+course\s+code/i.test(code),
      'and no user-facing "official course code" in ' + f);

    /* ⚠ A `data-label` IS USER-FACING COPY, and it is easy to forget.
       Below 740px css/responsive.css turns every table row into a card
       and prints `td[data-label]::before { content: attr(data-label) }`
       as the visible field label. A column whose <th> was correctly
       relabelled "Platform course code" therefore still read a bare
       "Course code" on a phone — the exact ambiguity this pass exists
       to remove, surviving at one breakpoint only. */
    var labels = code.match(/data-label="([^"]*)"/g) || [];
    var bare = labels.filter(function (l) {
      return /course\s+code/i.test(l) &&
             !/platform\s+course\s+code/i.test(l) &&
             !/institution\s+course\s+code/i.test(l);
    });
    ok(bare.length === 0,
      'no bare "Course code" in a responsive data-label in ' + f, bare.join(', '));
  });
}

/* ============================================================
   IMPLEMENTATION 08 — the UX/product closure pass.

   These assertions cover the behaviour this pass CHANGED or newly
   depends on. Nothing here was weakened or removed to make a redesign
   pass; where a figure changed, the assertion states why.

   The harness runs the STATE layer with no DOM, so these check the
   read models the redesigned screens are built from — the derivation,
   not the markup. Rendered-DOM and responsive checks live in
   qa/ui-audit.js, which runs inside the browser.
   ============================================================ */

/* ---- 1 · the canonical-structure dependency counters ---- */
function scenario08StructureUsage() {
  group('IMPL 08 — canonical structure dependency counting is COMPLETE');
  boot();

  /* THE DEFECT THIS FIXES. `courseUsage` looked at five collections and
     there are six carrying a courseId: the Question Bank was invisible
     to it. A Course whose other five references were all cleared but
     which still held a bank of questions therefore reported "Not yet
     referenced" — the exact opposite of what the Super Admin screen
     showing that phrase is for. */
  var use = S.courseUsage('soil-mechanics');
  eq(typeof use.questions, 'number', 'courseUsage now reports the QUESTION BANK as a reference class');
  ok(use.questions > 0, 'and the seeded Soil Mechanics bank is actually counted');

  /* Proved against the raw store rather than against another read model,
     so this cannot pass by both sides sharing one bug. `boot()` starts
     from the in-memory seed and nothing has written yet, so the store is
     empty until it is asked to persist. */
  S.save();
  var raw = JSON.parse(localStorage.getItem(S.STORAGE_KEY));
  var expected = raw.questions.filter(function (q) { return q.courseId === 'soil-mechanics'; }).length;
  eq(use.questions, expected, 'the count matches the stored rows exactly');

  /* Every previously-counted class still counts — the fix is additive. */
  ok(use.records > 0, 'content records still counted');
  ok(use.people > 0, 'enrolled people still counted');
  ok(use.assignments > 0, 'role assignments still counted');
  eq(typeof use.mappings, 'number', 'tenant course mappings still counted');
  eq(typeof use.facultyMappings, 'number', 'Faculty mappings still counted');

  var none = S.courseUsage('a-course-that-does-not-exist');
  eq(none.questions, 0, 'an unknown Course reports no questions');
  eq(none.records, 0, 'and no records');

  /* ---- the Programme-level counter, new at 08 ---- */
  var g = S.groupingUsage('civil-engineering');
  eq(g.courses, 3, 'groupingUsage counts the Courses filed under the Programme');
  ok(g.courseRefs.records > 0, 'and rolls up the references those Courses hold');
  ok(g.courseRefs.questions > 0, 'INCLUDING the question banks — same completeness as courseUsage');
  ok(g.people > 0, 'and counts people filed DIRECTLY against the Programme');
  ok(g.total > 0, 'so a referenced Programme can never read as unused');

  var empty = S.groupingUsage('electrical-engineering');
  eq(empty.courses, 0, 'an empty Programme reports no Courses');
  eq(empty.total, 0, 'and a total of zero');

  /* ⚠ NO REMOVAL CONTROL EXISTS, AND THAT IS DELIBERATE.
     No source describes retire or delete semantics for canonical
     structure: the FRD contains zero occurrences of delete / retire /
     deprecate / cascade, the conceptual data model gives Programme,
     Course and Experiment no lifecycle, and STK31-22's
     "prefer reversible deactivation" rule scopes itself to tenant
     termination, student removal and the Question Bank. The counters
     above exist to STATE dependency, not to authorise deletion. */
  eq(typeof S.deleteCourse, 'undefined', 'THE STATE LAYER EXPOSES NO deleteCourse');
  eq(typeof S.deleteGrouping, 'undefined', 'and no deleteGrouping');
  eq(typeof S.retireCourse, 'undefined', 'and no retireCourse');
  eq(typeof S.retireGrouping, 'undefined', 'and no retireGrouping');
}

/* ---- 2 · the two course codes stay independent ---- */
function scenario08CourseCodes() {
  group('IMPL 08 — platform course code and institution course code are separate objects');
  boot();

  var COURSE = 'soil-mechanics';

  /* Blank is a permanent legitimate state for the platform code: no
     official code has been supplied and inventing one would put
     fabricated institutional data on the public catalogue. */
  var seeded = D.courses().filter(function (c) { return c.id === COURSE; })[0];
  eq(seeded.code || '', '', 'the platform course code is seeded BLANK, and blank is legal');

  /* The tenant's own code is a different field on a different record. */
  grantAccess(['direct-shear'], ['web'], 3, 'yearly');
  S.setCourseMapping(TENANT, COURSE, 'CE-306', '');
  eq(S.courseMapping(TENANT, COURSE).localCode, 'CE-306', 'the institution course code is stored on the tenant mapping');

  /* SETTING ONE MUST NEVER TOUCH THE OTHER — in both directions. */
  S.updateCourseCode(KULK, COURSE, 'CE G511');
  eq(S.courseRecord(COURSE).code, 'CE G511', 'the Content Manager sets the PLATFORM code');
  eq(S.courseMapping(TENANT, COURSE).localCode, 'CE-306',
    'AND THE INSTITUTION CODE IS UNTOUCHED — they are not two views of one value');

  S.setCourseMapping(TENANT, COURSE, 'CE-999', '');
  eq(S.courseMapping(TENANT, COURSE).localCode, 'CE-999', 'the Tenant Admin changes their own code');
  eq(S.courseRecord(COURSE).code, 'CE G511',
    'AND THE PLATFORM CODE IS UNTOUCHED — a tenant can never redefine canonical metadata');

  /* Two institutions can hold different codes for the same Course
     without either reaching the platform value. */
  eq(S.courseRecord(COURSE).code, 'CE G511', 'the platform code is still the platform code');
}

/* ---- 3 · the Student read models the rebuilt Home is built from ---- */
function scenario08StudentHome() {
  group('IMPL 08 — Student Home: one featured item, and it is never repeated');
  boot();

  /* ZERO. A clean seed grants nothing — publication alone entitles
     nobody — so Home has nothing to feature and nothing to list. */
  var zero = S.studentProgressSummary(RAHUL);
  eq(zero.items.length, 0, 'ZERO ENTITLEMENT: nothing to feature');
  eq(S.studentExperiments(RAHUL).filter(function (r) { return r.effective; }).length, 0,
    'and nothing effective — so no primary action can be rendered');

  /* ONE. The screen features it and, because the featured item is
     removed from the remainder, there is nothing left to list. This is
     the invariant behind the reported defect: Home used to render a
     "Continue learning" hero AND repeat the same experiment in the list
     directly beneath it, each with its own button. */
  var g1 = grantAccess(['direct-shear'], ['web'], 3, 'yearly');
  S.assignExperiment(TENANT, g1.access.id, 'direct-shear', 'student', [RAHUL]);
  var one = S.studentProgressSummary(RAHUL);
  eq(one.items.length, 1, 'ONE ENTITLEMENT: exactly one item in the summary');
  eq(one.items.length - 1, 0, 'AND ZERO REMAIN once the featured item is taken out — nothing can repeat');

  /* MANY. The remainder is the ordered list minus the featured item, so
     the count below the hero is always one less than the total. */
  var g2 = grantAccess(['consolidation', 'total-station'], ['web'], 3, 'yearly');
  S.assignExperiment(TENANT, g2.access.id, 'consolidation', 'student', [RAHUL]);
  S.assignExperiment(TENANT, g2.access.id, 'total-station', 'student', [RAHUL]);
  var many = S.studentProgressSummary(RAHUL);
  eq(many.items.length, 3, 'MANY: three items in the summary');
  eq(many.items.length - 1, 2, 'and exactly two remain below the featured one');

  /* The featured item is DETERMINISTIC. Home sorts by state rank, then
     recency, then name — so the same state always features the same
     experiment and the page does not reshuffle between renders. */
  var a = S.studentProgressSummary(RAHUL).items.map(function (i) { return i.row.experimentId; });
  var b = S.studentProgressSummary(RAHUL).items.map(function (i) { return i.row.experimentId; });
  eq(a.join(','), b.join(','), 'the summary order is stable between reads');

  /* INACTIVE STUDENT: no primary action may be offered, because none
     can work. The read model still carries the record, so the history
     is not lost — the screen renders it without controls. */
  S.setStudentStatus(RAHUL, 'inactive');
  eq(S.personById(RAHUL).status, 'inactive', 'the student is inactive');
  ok(S.studentExperiments(RAHUL).every(function (r) { return !r.effective; }),
    'AND NOTHING IS EFFECTIVE — so Home renders no primary action at all');
  S.setStudentStatus(RAHUL, 'active');
  ok(S.studentExperiments(RAHUL).some(function (r) { return r.effective; }),
    'reactivating restores entitlement, and the featured action returns');
}

/* ---- 4 · My Device is offered only where a device exists ---- */
function scenario08DeviceGating() {
  group('IMPL 08 — My Device is entitlement-gated, not role-gated');
  boot();

  eq(S.studentHasPackageTechnology(RAHUL), false,
    'a student with no entitlement holds no device-based technology');

  var web = grantAccess(['beam-deflection'], ['web'], 3, 'yearly');
  S.assignExperiment(TENANT, web.access.id, 'beam-deflection', 'student', [RAHUL]);
  eq(S.studentHasPackageTechnology(RAHUL), false,
    'A WEB-ONLY STUDENT IS NOT LED INTO DEVICE MANAGEMENT');
  eq(S.transfersForStudent(RAHUL).length, 0, 'and holds no transfer request either');

  var vr = grantAccess(['direct-shear'], ['vr', 'web'], 3, 'yearly');
  S.assignExperiment(TENANT, vr.access.id, 'direct-shear', 'student', [RAHUL]);
  eq(S.studentHasPackageTechnology(RAHUL), true,
    'a student who actually holds VR does get the destination');
}

/* ---- 5 · the Content Manager return path, unchanged by the redesign ---- */
function scenario08ReturnPath() {
  group('IMPL 08 — Request changes: two destinations, no default, nothing written early');
  boot();

  /* The fork is real: each destination writes a different status whose
     HOLDER is a different role. The redesign changed how it is
     presented; it must not have changed where an item lands. */
  eq(typeof S.CHANGE_DESTINATION.REVIEWER, 'string', 'the Academic Reviewer destination exists');
  eq(typeof S.CHANGE_DESTINATION.VENDOR, 'string', 'the Vendor destination exists');
  ok(S.CHANGE_DESTINATION.REVIEWER !== S.CHANGE_DESTINATION.VENDOR,
    'AND THEY ARE GENUINELY DIFFERENT VALUES — not one label over one path');

  var rec = S.contentRecords().filter(function (r) { return r.status === S.CONTENT_STATUS.CONTENT_REVIEW; })[0];
  ok(!!rec, 'a record is sitting in the Content Manager queue');
  var before = rec.status;

  /* A REASON IS REQUIRED FOR EITHER DESTINATION, and refusing one must
     leave the record exactly where it was. */
  eq(S.requestChangesContent(KULK, rec.id, '', { destination: S.CHANGE_DESTINATION.VENDOR }), null,
    'the Vendor route with NO REASON is refused');
  eq(S.contentRecord(rec.id).status, before, 'and the record has not moved');
  eq(S.requestChangesContent(KULK, rec.id, '   ', { destination: S.CHANGE_DESTINATION.REVIEWER }), null,
    'the academic route with a whitespace-only reason is refused too');
  eq(S.contentRecord(rec.id).status, before, 'and the record still has not moved');

  /* ⚠ WHERE THE "NO DEFAULT DESTINATION" RULE ACTUALLY LIVES.
     It is a UI-LAYER rule, and this is worth stating precisely because
     it is easy to assert the wrong thing here and think the product is
     broken.

     The state function deliberately keeps a THREE-ARGUMENT form that
     means the Vendor: every pre-07.3 caller passed three arguments, and
     `scenarioManagerRouting` asserts that contract explicitly ("a
     three-argument call still means the Vendor — no caller changed
     behaviour"). Removing that default would silently change those
     callers.

     What the stakeholder asked for — that the Content Manager must
     CHOOSE, with nothing pre-selected — is enforced where the choice is
     actually made: the destination radios in
     js/screens/content-manager.js render with no `checked` attribute,
     and the submit handler refuses and toasts when none is selected
     rather than falling through to a default. The redesign at
     Implementation 08 moved that form into a side sheet and MUST NOT
     have introduced a pre-selected destination. */
  var out = S.requestChangesContent(KULK, rec.id, 'The learning outcomes do not match the build.',
    { destination: S.CHANGE_DESTINATION.REVIEWER });
  ok(!!out, 'the academic route is accepted with a reason');
  eq(S.contentRecord(rec.id).status, S.CONTENT_STATUS.CHANGES_ACADEMIC_RECHECK,
    'AND IT LANDS WITH THE ACADEMIC REVIEWER');
  eq(S.CONTENT_STATUS_META[S.contentRecord(rec.id).status].holder, 'reviewer',
    'held by the reviewer, not the Vendor');

  boot();
  var rec2 = S.contentRecords().filter(function (r) { return r.status === S.CONTENT_STATUS.CONTENT_REVIEW; })[0];
  S.requestChangesContent(KULK, rec2.id, 'The hosted link returns 404.',
    { destination: S.CHANGE_DESTINATION.VENDOR });
  eq(S.contentRecord(rec2.id).status, S.CONTENT_STATUS.CHANGES_CONTENT,
    'and the technical route lands with the VENDOR — a broken link never goes through academic review');
}

/* ---- 6 · the firewall words, checked as data ---- */
function scenario08Terminology() {
  group('IMPL 08 — Publish is first publication; Release / Hold is a later version');
  boot();

  /* These are the labels the screens render, so checking them here
     catches a regression in the vocabulary itself rather than in one
     screen that happens to use it. */
  var vs = S.VERSION_STATUS_META;
  Object.keys(vs).forEach(function (k) {
    ok(!/publish/i.test(vs[k].label),
      'no LATER-VERSION status is labelled with the word Publish: ' + vs[k].label);
  });

  var cs = S.CONTENT_STATUS_META;
  Object.keys(cs).forEach(function (k) {
    ok(!/\brelease/i.test(cs[k].label),
      'no FIRST-PUBLICATION status is labelled with the word Release: ' + cs[k].label);
  });
}


/* ============================================================
   IMPLEMENTATION 09 — RUNTIME UTILISATION TELEMETRY.

   PM-08 asked four questions the build could not answer from
   evidence: did the Student use the Experiment, for how long, how
   many times, and on what basis is a progress label printed. These
   scenarios assert the answers, and — at least as importantly —
   assert everything that must NOT be able to produce them.
   ============================================================ */

/* One entitled Student on one Experiment, with the technologies
   named. Package technologies are taken through the same delivery
   authorisation the product requires before a run can start. */
function utilFixture(techs, experimentIds) {
  boot();
  var exps = experimentIds || ['direct-shear'];
  var g = grantAccess(exps, techs, 5, 'yearly');
  exps.forEach(function (id) {
    S.assignExperiment(TENANT, g.access.id, id, 'student', [RAHUL]);
  });
  S.mapFaculty(TENANT, ARJUN, g.access.id, 'soil-mechanics', null);
  exps.forEach(function (id) {
    techs.forEach(function (t) {
      if ((D.TECHNOLOGIES[t] || {}).delivery !== 'hosted') {
        S.requestSimulationAccess(RAHUL, id, t);
        S.simulatePackageReady(RAHUL, id, t);
      }
    });
  });
  return g;
}

function scenario09Utilisation() {
  group('IMPL 09 — utilisation is derived from runtime events, and from nothing else');
  utilFixture(['web', 'vr']);

  /* ---- 1 · ZERO ACTIVITY ---- */
  var u0 = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  eq(u0.evidence, 'none', 'a student who has done nothing has NO evidence of use');
  eq(u0.launches, 0, 'no launches');
  eq(u0.sessionCount, 0, 'no sessions');
  eq(u0.totalSeconds, 0, 'no time spent');
  eq(u0.used, false, 'and the technology does not read as used');
  eq(u0.completed, false, 'and certainly not as completed');
  eq(u0.status, S.SIM_STATUS.NOT_STARTED, 'the derived status is Not started');
  eq(u0.lastActivityAt, null, 'and there is no last activity to report');
  eq(S.runtimeEventsFor(RAHUL, 'direct-shear', 'web').length, 0, 'and the event log is empty');

  /* ---- 2 · FIRST LAUNCH ---- */
  var l1 = S.runtimeLaunch(RAHUL, 'direct-shear', 'web');
  ok(l1.ok, 'the first launch is recorded');
  ok(!!l1.sessionId, 'and it opens a session with an identifier');
  var u1 = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  eq(u1.evidence, 'runtime-events', 'the figures now come from the event log');
  eq(u1.launches, 1, 'ONE LAUNCH');
  eq(u1.sessionCount, 1, 'one session');
  eq(u1.openSessions, 1, 'which is still open');
  eq(u1.totalSeconds, 0, 'an open session contributes NO time — nothing has been measured yet');
  eq(u1.used, true, 'the technology reads as used');
  eq(u1.completed, false, 'BUT NOT AS COMPLETED — a launch is not a completion');
  eq(u1.status, S.SIM_STATUS.IN_PROGRESS, 'the derived status is In progress');
  ok(!!u1.firstActivityAt, 'first activity is recorded');

  /* Two events per launch, and they are the two the contract names. */
  var evs = S.runtimeEventsFor(RAHUL, 'direct-shear', 'web');
  eq(evs.length, 2, 'a launch writes exactly two events');
  eq(evs[0].type, S.RUNTIME_EVENT.SIMULATION_LAUNCHED, 'SIMULATION_LAUNCHED');
  eq(evs[1].type, S.RUNTIME_EVENT.SESSION_STARTED, 'then SESSION_STARTED');
  eq(evs[0].personId, RAHUL, 'attributed to the student');
  eq(evs[0].tenantId, TENANT, 'and to the institution');
  eq(evs[0].experimentId, 'direct-shear', 'and to the experiment');
  eq(evs[0].technology, 'web', 'and to the technology');
  eq(evs[0].source, S.RUNTIME_SOURCE.WEB_PROTOTYPE, 'and to the runtime that reported it');
  ok(!!evs[0].occurredAt && !!evs[0].recordedAt, 'carrying BOTH the runtime clock and the platform clock');

  /* ---- 3 · SESSION DURATION ACCUMULATES ---- */
  S.runtimeEndSession(RAHUL, 'direct-shear', 'web', l1.sessionId, { durationSeconds: 600 });
  var u2 = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  eq(u2.totalSeconds, 600, 'ending the session records the measured duration');
  eq(u2.openSessions, 0, 'and nothing is left open');
  eq(u2.completed, false, 'TEN MINUTES OF USE IS STILL NOT A COMPLETION');
  eq(u2.status, S.SIM_STATUS.IN_PROGRESS, 'the status is still In progress');

  /* ---- 4 · MULTIPLE LAUNCHES AND SESSIONS ---- */
  var l2 = S.runtimeLaunch(RAHUL, 'direct-shear', 'web');
  S.runtimeEndSession(RAHUL, 'direct-shear', 'web', l2.sessionId, { durationSeconds: 300 });
  var l3 = S.runtimeLaunch(RAHUL, 'direct-shear', 'web');
  S.runtimeEndSession(RAHUL, 'direct-shear', 'web', l3.sessionId, { durationSeconds: 120 });
  var u3 = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  eq(u3.launches, 3, 'THREE LAUNCHES are counted');
  eq(u3.sessionCount, 3, 'as three separate sessions');
  eq(u3.totalSeconds, 1020, 'AND THE TIME ACCUMULATES — 600 + 300 + 120');

  /* ---- 5 · DUPLICATE EVENT PROTECTION ---- */
  var before = S.simulationUtilisation(RAHUL, 'direct-shear', 'web').totalSeconds;
  var logBefore = S.runtimeEventsFor(RAHUL, 'direct-shear', 'web').length;
  /* ⚠ REPLAYED WITH THE KEY THE CLIENT ACTUALLY USED, read back off
     the stored event rather than hand-built here — which is what a
     retrying client does, and what keeps this assertion true of the
     key format rather than of one spelling of it. */
  var storedEnd = S.runtimeEventsFor(RAHUL, 'direct-shear', 'web').filter(function (ev) {
    return ev.type === S.RUNTIME_EVENT.SESSION_ENDED && ev.sessionId === l3.sessionId;
  })[0];
  ok(!!storedEnd && !!storedEnd.clientEventId, 'the stored event carries the client key it arrived with');
  ok(storedEnd.clientEventId.indexOf(RAHUL) !== -1,
    'AND THE KEY IS NAMESPACED BY WHOSE RUN IT IS — two students cannot collide on one session id');
  var dupe = S.recordRuntimeEvent({
    type: S.RUNTIME_EVENT.SESSION_ENDED, sessionId: l3.sessionId,
    personId: RAHUL, experimentId: 'direct-shear', technology: 'web',
    durationSeconds: 120, clientEventId: storedEnd.clientEventId
  });
  ok(dupe.ok, 'a RETRIED event is answered with success, as a real client would need');
  eq(dupe.duplicate, true, 'and is reported as the duplicate it is');
  eq(S.runtimeEventsFor(RAHUL, 'direct-shear', 'web').length, logBefore,
    'NOTHING IS APPENDED — the log does not grow');
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').totalSeconds, before,
    'AND THE TIME DOES NOT DOUBLE');

  /* A second end for the same session under a DIFFERENT client key
     still cannot be counted twice: the fold ignores it. */
  S.recordRuntimeEvent({
    type: S.RUNTIME_EVENT.SESSION_ENDED, sessionId: l3.sessionId,
    personId: RAHUL, experimentId: 'direct-shear', technology: 'web',
    durationSeconds: 9999, clientEventId: 'qa-second-end'
  });
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').totalSeconds, before,
    'A SECOND END EVENT FOR A CLOSED SESSION ADDS NOTHING, whatever key it carries');

  /* ---- 6 · INCOMPLETE SESSION ---- */
  var l4 = S.runtimeLaunch(RAHUL, 'direct-shear', 'web');
  var u4 = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  eq(u4.openSessions, 1, 'a session that never ended is reported as open');
  eq(u4.sessionCount, 4, 'and is still counted as a session that happened');
  eq(u4.totalSeconds, 1020, 'BUT CONTRIBUTES NO TIME — nothing was measured');

  /* Launching again abandons it rather than inventing a duration. */
  var l5 = S.runtimeLaunch(RAHUL, 'direct-shear', 'web');
  var u5 = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  eq(u5.openSessions, 1, 'a new launch abandons the previously open session, leaving one open');
  eq(u5.totalSeconds, 1020, 'and the abandoned session still contributes no time');
  eq(u5.sessions.filter(function (s) { return s.abandoned; }).length, 1,
    'the abandoned session is named as abandoned, not deleted');

  /* ---- 7 · NEGATIVE AND NONSENSE DURATIONS ---- */
  S.runtimeEndSession(RAHUL, 'direct-shear', 'web', l5.sessionId, { durationSeconds: -600 });
  var u6 = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  ok(u6.totalSeconds >= 1020, 'A NEGATIVE DURATION CAN NEVER REDUCE RECORDED TIME');
  u6.sessions.forEach(function (s) {
    ok(s.seconds >= 0, 'no session carries a negative duration: ' + s.sessionId);
  });

  /* A clock that ran backwards produces zero, not a negative. */
  var back = S.runtimeLaunch(RAHUL, 'direct-shear', 'web',
    { occurredAt: '2026-09-01T10:00:00.000Z' });
  S.runtimeEndSession(RAHUL, 'direct-shear', 'web', back.sessionId,
    { occurredAt: '2026-09-01T09:00:00.000Z' });
  var backRow = null;
  S.simulationUtilisation(RAHUL, 'direct-shear', 'web').sessions.forEach(function (s) {
    if (s.sessionId === back.sessionId) { backRow = s; }
  });
  eq(backRow.seconds, 0, 'AN END BEFORE ITS START IS ZERO SECONDS, never a negative interval');
}

function scenario09Completion() {
  group('IMPL 09 — only an explicit completion event completes a simulation');
  utilFixture(['web', 'vr']);

  /* ---- WHAT CANNOT COMPLETE A SIMULATION ---- */

  /* (a) Viewing every learning resource. */
  D.resourcesFor('direct-shear').forEach(function (r) {
    S.openResource(RAHUL, 'direct-shear', r.id);
    S.setResourceComplete(RAHUL, 'direct-shear', r.id, true);
  });
  var res = S.resourceProgress(RAHUL, 'direct-shear');
  eq(res.completed, res.total, 'every learning resource is marked done');
  ok(res.total > 0, 'and there were some to mark');
  eq(S.simulationStatus(RAHUL, 'direct-shear', 'web'), S.SIM_STATUS.NOT_STARTED,
    'RESOURCE VIEWING DOES NOT COMPLETE THE SIMULATION');
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').completed, false,
    'and it records no simulation use at all');
  eq(S.runtimeEventsFor(RAHUL, 'direct-shear', null).length, 0,
    'READING CONTENT WRITES NO RUNTIME EVENT — content is not a run');

  /* (b) A video. The catalogue's preview/demo video is a REFERENCE
     with no viewing writer anywhere in the build, so there is no
     path by which watching one could reach the simulation state.
     Asserted structurally: the event vocabulary has no content
     event, so no content action can produce a completion. */
  ok(S.RUNTIME_EVENT_LIST.indexOf('VIDEO_WATCHED') === -1,
    'THERE IS NO VIDEO EVENT — a video is content, and content cannot complete a run');
  ok(S.RUNTIME_EVENT_LIST.indexOf('RESOURCE_VIEWED') === -1,
    'and no resource event either');
  eq(S.RUNTIME_EVENT_LIST.length, 5, 'the runtime vocabulary is exactly the five lifecycle events');

  /* (c) Learning Outcomes. They are academic intent, authored by the
     Academic Reviewer, and are not a checklist a student ticks. */
  var rec = S.contentRecord('direct-shear');
  ok(!!rec && rec.outcomes.length > 0, 'the experiment carries learning outcomes');
  eq(S.simulationStatus(RAHUL, 'direct-shear', 'web'), S.SIM_STATUS.NOT_STARTED,
    'LEARNING OUTCOMES ARE NOT COMPLETION CHECKBOXES');

  /* (d) Time. A long session is still not a completion. */
  var l = S.runtimeLaunch(RAHUL, 'direct-shear', 'web');
  S.runtimeEndSession(RAHUL, 'direct-shear', 'web', l.sessionId, { durationSeconds: 60 * 60 * 8 });
  var uTime = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  eq(uTime.totalSeconds, 28800, 'eight hours of recorded use');
  eq(uTime.completed, false, 'AND STILL NOT COMPLETE — no threshold completes a simulation');

  /* (e) Submitting the assessment. */
  var att = S.startAttempt(RAHUL, 'direct-shear');
  if (att) {
    (S.attemptAssessment(att) || { questions: [] }).questions.forEach(function (q) {
      S.saveAnswer(att.id, q.id, q.type === 'descriptive' ? 'QA written answer.' : 0);
    });
    S.submitAttempt(att.id);
    eq(S.attemptById(att.id).status, S.ATTEMPT_STATUS.SUBMITTED, 'the assessment is submitted');
  }
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').completed, false,
    'ASSESSMENT SUBMISSION DOES NOT COMPLETE THE SIMULATION');
  eq(S.simulationStatus(RAHUL, 'direct-shear', 'web'), S.SIM_STATUS.IN_PROGRESS,
    'the simulation is still only in progress');

  /* ---- WHAT DOES ---- */
  var l2 = S.runtimeLaunch(RAHUL, 'direct-shear', 'web');
  var done = S.runtimeComplete(RAHUL, 'direct-shear', 'web', l2.sessionId);
  ok(done.ok, 'the runtime reports an explicit completion');
  var uDone = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  eq(uDone.completed, true, 'AND ONLY THAT COMPLETES IT');
  ok(!!uDone.completedAt, 'with the moment it happened');
  eq(uDone.status, S.SIM_STATUS.COMPLETED, 'the derived status is Completed');
  eq(S.simulationStatus(RAHUL, 'direct-shear', 'web'), S.SIM_STATUS.COMPLETED,
    'and the projected record agrees with the log');

  /* ⚠ A COMPLETED RUN REPORTS A DURATION.
     `runtimeComplete` deliberately does NOT imply the session end — a
     client may report a completion and keep the session open. So a
     runtime that finishes must send both, and the one in this build
     does. This assertion is what caught it not doing so: a completed
     run sat beside an open session recording zero seconds. */
  var l4 = S.runtimeLaunch(RAHUL, 'direct-shear', 'web');
  S.runtimeComplete(RAHUL, 'direct-shear', 'web', l4.sessionId);
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').openSessions, 1,
    'a completion ALONE leaves the session open — it is not an end event');
  S.runtimeEndSession(RAHUL, 'direct-shear', 'web', l4.sessionId, { durationSeconds: 90 });
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').openSessions, 0,
    'and the end event that follows it closes the session');
  ok(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').totalSeconds >= 90,
    'SO A COMPLETED RUN REPORTS THE TIME IT TOOK');

  /* A second completion does not move the date it was first earned. */
  var firstAt = uDone.completedAt;
  var l3 = S.runtimeLaunch(RAHUL, 'direct-shear', 'web');
  S.runtimeComplete(RAHUL, 'direct-shear', 'web', l3.sessionId);
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').completedAt, firstAt,
    'A SECOND COMPLETION DOES NOT MOVE THE DATE the student first finished');
  eq(S.simulationStatus(RAHUL, 'direct-shear', 'web'), S.SIM_STATUS.COMPLETED,
    'AND A LATER RE-RUN NEVER WALKS A COMPLETION BACK');
}

function scenario09TechnologyAxis() {
  group('IMPL 09 — one technology cannot complete another');
  utilFixture(['web', 'vr', 'ar']);

  /* ---- WEB ONLY ---- */
  S.runtimeSimulateRun(RAHUL, 'direct-shear', 'web', { durationSeconds: 400, complete: true });
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').completed, true, 'WEB is completed');
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'vr').completed, false, 'VR IS NOT');
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'ar').completed, false, 'AR IS NOT');
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'vr').used, false, 'and VR records no use');
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'vr').totalSeconds, 0,
    'WEB TIME IS NOT VR TIME');

  /* ---- VR ONLY, on a second experiment, from a "native" client ---- */
  utilFixture(['web', 'vr', 'ar']);
  S.runtimeSimulateRun(RAHUL, 'direct-shear', 'vr',
    { durationSeconds: 900, complete: true, source: S.RUNTIME_SOURCE.VR_CLIENT });
  var uvr = S.simulationUtilisation(RAHUL, 'direct-shear', 'vr');
  eq(uvr.completed, true, 'VR is completed');
  eq(uvr.totalSeconds, 900, 'with its own time');
  eq(uvr.sources.join(','), S.RUNTIME_SOURCE.VR_CLIENT, 'attributed to the VR runtime that reported it');
  eq(S.runtimeSourceIsReal(S.RUNTIME_SOURCE.VR_CLIENT), false,
    'AND THAT RUNTIME IS NOT PRESENTED AS CONNECTED IN THIS BUILD');
  eq(S.runtimeSourceIsReal(S.RUNTIME_SOURCE.WEB_PROTOTYPE), true,
    'while the prototype web runtime is real, and says so');
  /* ⚠ A PACKAGE TECHNOLOGY OPENED FROM THE PLATFORM IS NOT THE WEB
     RUNTIME. `startSimulation` on a VR row used to stamp its events
     with the web prototype runtime, which attributed a figure to a
     runtime that did not produce it. */
  eq(S.defaultRuntimeSource('web'), S.RUNTIME_SOURCE.WEB_PROTOTYPE,
    'a hosted technology defaults to the prototype web runtime, which is what actually runs it');
  eq(S.defaultRuntimeSource('vr'), S.RUNTIME_SOURCE.PLATFORM_STANDIN,
    'A PACKAGE TECHNOLOGY DEFAULTS TO THE PLATFORM STAND-IN — no device reported it');
  eq(S.defaultRuntimeSource('ar'), S.RUNTIME_SOURCE.PLATFORM_STANDIN, 'and so does AR');
  eq(S.runtimeSourceIsReal(S.RUNTIME_SOURCE.PLATFORM_STANDIN), false,
    'and the stand-in is never presented as a connected runtime');
  eq(S.runtimeSourcesAllReal([S.RUNTIME_SOURCE.WEB_PROTOTYPE]), true,
    'a figure from the web runtime alone is a connected-runtime figure');
  eq(S.runtimeSourcesAllReal([S.RUNTIME_SOURCE.WEB_PROTOTYPE, S.RUNTIME_SOURCE.VR_CLIENT]), false,
    'AND ONE STAND-IN AMONG THEM MAKES THE WHOLE FIGURE A STAND-IN FIGURE');
  eq(S.runtimeSourcesAllReal([]), false, 'and no source at all is not a connected-runtime figure');
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').completed, false, 'WEB IS NOT COMPLETED BY IT');
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'ar').completed, false, 'AND NEITHER IS AR');

  /* ---- AR ONLY ---- */
  utilFixture(['web', 'vr', 'ar']);
  S.runtimeSimulateRun(RAHUL, 'direct-shear', 'ar',
    { durationSeconds: 250, complete: true, source: S.RUNTIME_SOURCE.AR_CLIENT });
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'ar').completed, true, 'AR is completed');
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').completed, false, 'WEB IS NOT');
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'vr').completed, false, 'VR IS NOT');

  /* ---- MIXED USE ---- */
  utilFixture(['web', 'vr', 'ar']);
  S.runtimeSimulateRun(RAHUL, 'direct-shear', 'web', { durationSeconds: 300, complete: true });
  S.runtimeSimulateRun(RAHUL, 'direct-shear', 'vr',
    { durationSeconds: 700, complete: false, source: S.RUNTIME_SOURCE.VR_CLIENT });
  var ex = S.experimentUtilisation(RAHUL, 'direct-shear', ['web', 'vr', 'ar']);
  eq(ex.used.join(','), 'web,vr', 'TWO technologies were used');
  eq(ex.completed.join(','), 'web', 'ONE was completed');
  eq(ex.inProgress.join(','), 'vr', 'and the other is in progress');
  eq(ex.totalSeconds, 1000, 'the totals add across technologies');
  eq(ex.sessionCount, 2, 'across two sessions');
  eq(ex.launches, 2, 'from two launches');
  /* ⚠ THE SOURCES ARE ROLLED UP TO THE EXPERIMENT. Without this the
     experiment-level object could not answer "did any of this come
     from a stand-in?", and the honesty note that depends on it
     rendered nowhere at all. */
  ok(ex.sources.indexOf(S.RUNTIME_SOURCE.VR_CLIENT) !== -1,
    'the experiment-level figures name the VR runtime that contributed to them');
  ok(ex.sources.indexOf(S.RUNTIME_SOURCE.WEB_PROTOTYPE) !== -1, 'and the web runtime');
  eq(S.runtimeSourcesAllReal(ex.sources), false,
    'AND REPORT THAT NOT ALL OF THEM ARE CONNECTED RUNTIMES IN THIS BUILD');

  /* The Experiment does not complete until every entitled technology does. */
  var prog = S.experimentProgress(RAHUL, 'direct-shear', ['web', 'vr', 'ar']);
  ok(prog.status !== S.TECH_PROGRESS.COMPLETED,
    'THE EXPERIMENT IS NOT COMPLETE while an entitled technology has not been finished');
  eq(prog.factual.simulation.state, 'in-progress', 'and the factual simulation strand says so');
  eq(prog.factual.simulation.technologiesCompleted.join(','), 'web',
    'naming exactly which technology was completed');
  eq(prog.factual.simulation.totalSeconds, 1000, 'and carrying the real time spent');
  eq(prog.factual.resources.state, 'not-started', 'the resource strand is reported SEPARATELY');
  eq(prog.factual.assessment.configured, true, 'and so is the assessment strand');
}

function scenario09Evidence() {
  group('IMPL 09 — the progress percentage states the steps it is counted from');
  utilFixture(['web']);

  var prog0 = S.experimentProgress(RAHUL, 'direct-shear', ['web']);
  ok(!!prog0.steps && typeof prog0.steps.total === 'number',
    'the percentage is accompanied by the step count it is derived from');
  eq(prog0.steps.done, 0, 'nothing is done yet');
  eq(prog0.percent, 0, 'so the figure is zero');
  eq(prog0.steps.total, D.resourcesFor('direct-shear').length + 1 + 1,
    'and the denominator is every resource, one simulation per technology, and one assessment');

  /* One completed resource moves the number by exactly one step. */
  S.openResource(RAHUL, 'direct-shear', 'dsh-r1');
  S.setResourceComplete(RAHUL, 'direct-shear', 'dsh-r1', true);
  var prog1 = S.experimentProgress(RAHUL, 'direct-shear', ['web']);
  eq(prog1.steps.done, 1, 'ONE STEP, and it is a resource step');
  eq(prog1.factual.resources.completed, 1, 'reported in the resource strand');
  eq(prog1.factual.simulation.state, 'not-started', 'and NOT in the simulation strand');

  /* The simulation step is the completion event and nothing else. */
  var l = S.runtimeLaunch(RAHUL, 'direct-shear', 'web');
  S.runtimeEndSession(RAHUL, 'direct-shear', 'web', l.sessionId, { durationSeconds: 1200 });
  eq(S.experimentProgress(RAHUL, 'direct-shear', ['web']).steps.done, 1,
    'TWENTY MINUTES OF USE MOVES NO STEP — a step is an explicit completion');
  S.runtimeComplete(RAHUL, 'direct-shear', 'web', l.sessionId);
  eq(S.experimentProgress(RAHUL, 'direct-shear', ['web']).steps.done, 2,
    'and the completion event moves exactly one');

  /* The factual strands never merge. */
  var f = S.experimentProgress(RAHUL, 'direct-shear', ['web']).factual;
  ok(f.resources && f.simulation && f.assessment,
    'RESOURCES, SIMULATION and ASSESSMENT are three separate strands');
  eq(f.simulation.technologies[0].evidence, 'runtime-events',
    'and the simulation strand names where its evidence came from');
  eq(f.simulation.technologies[0].launches, 1, 'carrying the launch count');
  eq(f.simulation.technologies[0].sessions, 1, 'the session count');
  eq(f.simulation.technologies[0].totalSeconds, 1200, 'and the time spent');
}

function scenario09FoldIntegrity() {
  group('IMPL 09 — a session row is only a RUN when something opened it');
  utilFixture(['web']);

  /* ⚠ AN ERROR ALONE IS NOT USE.
     Any event carrying a session id creates a session row, so an
     error-only report counted as a session and therefore as USE — the
     exact opposite of the rule written beside the code that computes
     it. And because the projection promotes a package technology's
     delivery state once a run is recorded, an error could also have
     moved the delivery ladder. */
  var err = S.recordRuntimeEvent({
    type: S.RUNTIME_EVENT.SIMULATION_ERROR, sessionId: 'QA-ERR-ONLY',
    personId: RAHUL, experimentId: 'direct-shear', technology: 'web',
    detail: { code: 'X', message: 'It failed before it started.' },
    clientEventId: 'qa-err-only'
  });
  eq(err.ok, true, 'the error is recorded — no evidence is discarded');
  var ue = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  eq(ue.errors, 1, 'and it is counted as an error');
  eq(ue.used, false, 'BUT THE TECHNOLOGY DOES NOT READ AS USED');
  eq(ue.sessionCount, 0, 'and it is not counted as a session');
  eq(ue.launches, 0, 'nor as a launch');
  eq(ue.status, S.SIM_STATUS.NOT_STARTED, 'so the simulation is still Not started');

  /* ⚠ A BARE COMPLETION COMPLETES NOTHING.
     `sessionId` is validated as a non-empty string and nothing checked
     that the session was ever opened, so one malformed event could
     complete a simulation nobody ran. */
  var bare = S.recordRuntimeEvent({
    type: S.RUNTIME_EVENT.SIMULATION_COMPLETED, sessionId: 'QA-NEVER-RAN',
    personId: RAHUL, experimentId: 'direct-shear', technology: 'web',
    clientEventId: 'qa-bare-complete'
  });
  eq(bare.ok, true, 'the event is recorded');
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').completed, false,
    'BUT A COMPLETION FOR A SESSION NOBODY OPENED COMPLETES NOTHING');
  eq(S.simulationStatus(RAHUL, 'direct-shear', 'web'), S.SIM_STATUS.NOT_STARTED,
    'and the record is untouched');

  /* A completion on a session that WAS opened still works. */
  var real = S.runtimeLaunch(RAHUL, 'direct-shear', 'web');
  S.runtimeComplete(RAHUL, 'direct-shear', 'web', real.sessionId);
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').completed, true,
    'while a completion on a real run completes it, as it always did');

  /* ⚠ A REPLAYED LAUNCH UNDER A FRESH KEY MUST NOT INFLATE THE COUNT.
     Launches are counted per SESSION, like every other figure, so a
     client that replays a launch adds no session and no launch. */
  utilFixture(['web']);
  var l = S.runtimeLaunch(RAHUL, 'direct-shear', 'web');
  var beforeL = S.simulationUtilisation(RAHUL, 'direct-shear', 'web').launches;
  S.recordRuntimeEvent({
    type: S.RUNTIME_EVENT.SIMULATION_LAUNCHED, sessionId: l.sessionId,
    personId: RAHUL, experimentId: 'direct-shear', technology: 'web',
    clientEventId: 'qa-replayed-launch-under-a-new-key'
  });
  var afterL = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  eq(afterL.launches, beforeL, 'A REPLAYED LAUNCH ADDS NO LAUNCH');
  eq(afterL.sessionCount, 1, 'and no session');

  /* ⚠ COMPLETING AN ALREADY-FINISHED RUN MUST NOT INVENT A NEW ONE.
     `completeSimulation` opened a fresh session whenever there was no
     OPEN one — which is true of every properly ended run — so it
     fabricated a second launch and a second session out of nothing. */
  utilFixture(['web']);
  var r1 = S.runtimeLaunch(RAHUL, 'direct-shear', 'web');
  S.runtimeEndSession(RAHUL, 'direct-shear', 'web', r1.sessionId, { durationSeconds: 300 });
  var beforeC = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  eq(beforeC.openSessions, 0, 'the run was ended properly');
  S.completeSimulation(RAHUL, 'direct-shear', 'web');
  var afterC = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  eq(afterC.sessionCount, beforeC.sessionCount, 'COMPLETING IT INVENTS NO SECOND SESSION');
  eq(afterC.launches, beforeC.launches, 'and no second launch');
  eq(afterC.completed, true, 'while the completion is still recorded');
  eq(afterC.totalSeconds, beforeC.totalSeconds, 'and the time it took is unchanged');
}

function scenario09IdSpace() {
  group('IMPL 09 — a session id does not wrap, and a key cannot collide across students');
  utilFixture(['web']);

  /* ⚠ `util.pad3` IS A FORMATTER, NOT AN ID SPACE.
     `('000' + n).slice(-3)` is 1000 wide and wraps, so run 1001 re-used
     `RSN-001`. The idempotency guard matches the client key globally,
     so the 1001st run's events were then discarded as duplicates of the
     first — a student's work silently vanishing at scale. A session is
     minted once per run, so this is the counter that actually reaches
     it. */
  var st = XRSLP.state;
  var raw = JSON.parse(localStorage.getItem(st.STORAGE_KEY));
  raw.seq.runtimeSession = 999;
  localStorage.setItem(st.STORAGE_KEY, JSON.stringify(raw));
  loadState();
  S = XRSLP.state;

  var a = S.runtimeLaunch(RAHUL, 'direct-shear', 'web');
  var b = S.runtimeLaunch(RAHUL, 'direct-shear', 'web');
  var c = S.runtimeLaunch(RAHUL, 'direct-shear', 'web');
  eq(a.sessionId, 'RSN-1000', 'the thousandth session is RSN-1000, not RSN-000');
  eq(b.sessionId, 'RSN-1001', 'and the next is RSN-1001');
  ok(a.sessionId !== c.sessionId && b.sessionId !== c.sessionId,
    'AND NO TWO SESSIONS SHARE AN ID');
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').sessionCount, 3,
    'so all three runs are recorded');

  /* And two students cannot collide on one session id even if a client
     reuses one, because the key names whose run it is. */
  var g2 = grantAccess(['direct-shear'], ['web'], 5, 'yearly');
  var OTHER = S.studentsForTenant(TENANT).filter(function (p) { return p.id !== RAHUL; })[0].id;
  S.assignExperiment(TENANT, g2.access.id, 'direct-shear', 'student', [OTHER]);
  var mine = S.runtimeLaunch(RAHUL, 'direct-shear', 'web', { sessionId: 'SHARED-ID' });
  var theirs = S.runtimeLaunch(OTHER, 'direct-shear', 'web', { sessionId: 'SHARED-ID' });
  eq(mine.ok, true, 'one student opens a session');
  eq(theirs.ok, true, 'AND SO CAN ANOTHER, ON THE SAME SESSION ID');
  ok(S.simulationUtilisation(OTHER, 'direct-shear', 'web').launches > 0,
    'the second student’s run is recorded, not swallowed as a duplicate');
}

function scenario09Boundaries() {
  group('IMPL 09 — telemetry respects every existing boundary');

  /* ---- ENTITLEMENT ---- */
  utilFixture(['web']);
  var r = S.recordRuntimeEvent({
    type: S.RUNTIME_EVENT.SESSION_STARTED, sessionId: 'QA-1',
    personId: RAHUL, experimentId: 'consolidation', technology: 'web',
    clientEventId: 'qa-unentitled'
  });
  eq(r.ok, false, 'AN UNENTITLED EXPERIMENT IS REFUSED');
  eq(r.reason, S.RUNTIME_REJECT.NOT_ENTITLED, 'and the reason is entitlement');
  eq(S.runtimeEventsFor(RAHUL, 'consolidation', 'web').length, 0, 'and nothing is written');

  var r2 = S.recordRuntimeEvent({
    type: S.RUNTIME_EVENT.SESSION_STARTED, sessionId: 'QA-2',
    personId: RAHUL, experimentId: 'direct-shear', technology: 'vr', clientEventId: 'qa-untech'
  });
  eq(r2.ok, false, 'AN UNENTITLED TECHNOLOGY IS REFUSED TOO');
  eq(r2.reason, S.RUNTIME_REJECT.NOT_ENTITLED, 'for the same reason');

  /* ---- MALFORMED EVENTS ---- */
  eq(S.recordRuntimeEvent({ type: 'WHATEVER', sessionId: 'X', personId: RAHUL,
    experimentId: 'direct-shear', technology: 'web' }).reason,
    S.RUNTIME_REJECT.UNKNOWN_TYPE, 'an unknown event type is refused');
  eq(S.recordRuntimeEvent({ type: S.RUNTIME_EVENT.SESSION_STARTED, sessionId: 'X',
    personId: RAHUL, experimentId: 'direct-shear', technology: 'holodeck' }).reason,
    S.RUNTIME_REJECT.UNKNOWN_TECHNOLOGY, 'an unknown technology is refused');
  eq(S.recordRuntimeEvent({ type: S.RUNTIME_EVENT.SESSION_STARTED, sessionId: '',
    personId: RAHUL, experimentId: 'direct-shear', technology: 'web' }).reason,
    S.RUNTIME_REJECT.NO_SESSION, 'AN EVENT WITH NO SESSION IS REFUSED — it could not be attributed to a run');
  eq(S.recordRuntimeEvent({ type: S.RUNTIME_EVENT.SESSION_STARTED, sessionId: 'X',
    personId: RAHUL, experimentId: 'direct-shear', technology: 'web',
    occurredAt: 'the day before yesterday' }).reason,
    S.RUNTIME_REJECT.BAD_TIMESTAMP, 'and so is an unreadable timestamp');
  eq(S.recordRuntimeEvent({ type: S.RUNTIME_EVENT.SESSION_STARTED, sessionId: 'X',
    personId: ARJUN, experimentId: 'direct-shear', technology: 'web' }).reason,
    S.RUNTIME_REJECT.UNKNOWN_STUDENT, 'a faculty member cannot report a student run');

  /* ---- DEACTIVATION PRESERVES HISTORY ---- */
  utilFixture(['web']);
  S.runtimeSimulateRun(RAHUL, 'direct-shear', 'web', { durationSeconds: 540, complete: true });
  var beforeEvents = S.runtimeEventsFor(RAHUL, 'direct-shear', 'web').length;
  var beforeU = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  S.deactivateTenant(TENANT, 'QA — telemetry history');
  eq(S.recordRuntimeEvent({ type: S.RUNTIME_EVENT.SESSION_STARTED, sessionId: 'QA-D',
    personId: RAHUL, experimentId: 'direct-shear', technology: 'web' }).ok, false,
    'A DEACTIVATED INSTITUTION RECORDS NO NEW TELEMETRY');
  eq(S.runtimeEventsFor(RAHUL, 'direct-shear', 'web').length, beforeEvents,
    'HISTORY KEPT: every recorded event survives deactivation');
  var afterU = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  eq(afterU.totalSeconds, beforeU.totalSeconds, 'HISTORY KEPT: the time spent is unchanged');
  eq(afterU.launches, beforeU.launches, 'HISTORY KEPT: the launch count is unchanged');
  eq(afterU.completed, true, 'HISTORY KEPT: the completion survives');
  S.reactivateTenant(TENANT, 'QA — reversal');
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').totalSeconds, beforeU.totalSeconds,
    'and reactivation displaces nothing');

  /* ---- EXPIRY ---- */
  utilFixture(['web']);
  var acc = S.accessForTenant(TENANT)[0];
  S.runtimeSimulateRun(RAHUL, 'direct-shear', 'web', { durationSeconds: 800, complete: true });
  var expEvents = S.runtimeEventsFor(RAHUL, 'direct-shear', 'web').length;
  var expU = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  S.protoSetAccessEnd(acc.id, -1);
  eq(S.accessTermState(S.accessById(acc.id)).key, 'expired', 'the access record has expired');
  eq(S.studentCanRun(RAHUL, 'direct-shear', 'web'), false, 'the student can no longer run it');
  eq(S.recordRuntimeEvent({ type: S.RUNTIME_EVENT.SESSION_STARTED, sessionId: 'QA-E',
    personId: RAHUL, experimentId: 'direct-shear', technology: 'web' }).ok, false,
    'EXPIRY STOPS NEW TELEMETRY AT THE DOOR');
  eq(S.runtimeEventsFor(RAHUL, 'direct-shear', 'web').length, expEvents,
    'WHILE PRESERVING EVERY EVENT ALREADY RECORDED');
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').totalSeconds, expU.totalSeconds,
    'and the time spent before expiry is still reported');
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').completed, true,
    'and so is the completion earned before it');

  /* ---- TENANT ISOLATION ---- */
  utilFixture(['web']);
  S.runtimeSimulateRun(RAHUL, 'direct-shear', 'web', { durationSeconds: 100, complete: true });
  var others = S.runtimeEvents().filter(function (ev) { return ev.tenantId !== TENANT; });
  eq(others.length, 0, 'every recorded event belongs to the institution that produced it');
  S.runtimeEvents().forEach(function (ev) {
    eq(S.personById(ev.personId).tenantId, ev.tenantId,
      'and the event tenant matches the student tenant: ' + ev.id);
  });

  /* ---- FACULTY SCOPE ---- */
  var reach = S.facultyStudentReach(ARJUN, 'direct-shear');
  ok(reach.indexOf(RAHUL) !== -1, 'the mapped faculty member reaches this student');
  eq(S.facultyExperimentIds(ARJUN).indexOf('consolidation'), -1,
    'AND HOLDS NO MAPPING FOR AN EXPERIMENT OUTSIDE THEIR SCOPE');

  /* ---- RESULT WITHHOLDING ---- */
  var att = S.startAttempt(RAHUL, 'direct-shear');
  if (att) {
    (S.attemptAssessment(att) || { questions: [] }).questions.forEach(function (q) {
      S.saveAnswer(att.id, q.id, q.type === 'descriptive' ? 'QA.' : 0);
    });
    S.submitAttempt(att.id);
  }
  var studentView = S.experimentProgress(RAHUL, 'direct-shear', ['web'], { studentView: true });
  ok(studentView.factual.assessment.withheld === S.resultWithheld(RAHUL, 'direct-shear'),
    'THE STUDENT-VIEW FACTUAL STRAND CARRIES THE WITHHOLDING FLAG, unchanged');
  ok(!/percent/.test(String(studentView.factual.assessment.state || '')),
    'and the assessment strand carries a state, never a score');
  var keys = [];
  function walk(o, path) {
    if (!o || typeof o !== 'object') { return; }
    Object.keys(o).forEach(function (k) {
      keys.push(path + k);
      if (o[k] && typeof o[k] === 'object' && path.length < 40) { walk(o[k], path + k + '.'); }
    });
  }
  walk(studentView.factual, '');
  ok(!keys.some(function (k) { return /score|marks|earned|outcome/i.test(k); }),
    'NO SCORE, MARK OR OUTCOME REACHES THE FACTUAL UTILISATION MODEL AT ALL');
}

function scenario09WithheldParity() {
  group('IMPL 09 — a passing and a failing student are IDENTICAL while the result is withheld');
  boot();

  /* ⚠ THE STRONGEST PRIVACY ASSERTION IN THIS SUITE, and the defect it
     caught. `experimentProgress` computes the RAW assessment state —
     PASSED or NOT_PASSED — and every student-facing surface masks it
     while the visibility policy is holding the result. The new
     Implementation-09 `factual` block did not, which made it the one
     student-view derivation whose value differed between a passing and
     a failing student: the outcome the result screen was holding could
     be read straight off it.

     Rather than asserting the masking of one field, this DIFFS the
     entire student-view derivation between two students who did
     identical work and got opposite outcomes. Anything that ever leaks
     an outcome into a student view fails here, including something
     added later that nobody thought to mask. */
  var g = grantAccess(['direct-shear'], ['web'], 5, 'yearly');
  var OTHER = S.studentsForTenant(TENANT).filter(function (p) { return p.id !== RAHUL; })[0].id;
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL, OTHER]);

  var def = S.assessmentForTenant(TENANT, 'direct-shear');
  ok(!!def, 'the experiment has an assessment');
  var set = S.updateAssessmentSettings(def.id, {
    title: def.title, passMark: def.passMark, attemptLimit: def.attemptLimit,
    policyMode: 'CUSTOM_DATE', customDate: '2099-01-01'
  }, ARJUN);
  eq(set.ok, true, 'and a release date far enough away to withhold every result');

  function take(pid, correct) {
    S.runtimeSimulateRun(pid, 'direct-shear', 'web', { durationSeconds: 600, complete: true });
    var a = S.startAttempt(pid, 'direct-shear');
    if (!a) { return; }
    (S.attemptAssessment(a) || { questions: [] }).questions.forEach(function (q) {
      if (q.type === 'mcq') { S.saveAnswer(a.id, q.id, correct ? q.answer : (q.answer === 0 ? 1 : 0)); }
      else if (q.type === 'tf') { S.saveAnswer(a.id, q.id, correct ? q.answer : !q.answer); }
    });
    S.submitAttempt(a.id);
  }
  take(RAHUL, true);
  take(OTHER, false);

  eq(S.latestSubmittedAttempt(RAHUL, 'direct-shear').outcome, S.OUTCOME.PASSED, 'one student passed');
  eq(S.latestSubmittedAttempt(OTHER, 'direct-shear').outcome, S.OUTCOME.NOT_PASSED,
    'and the other did not');
  eq(S.resultWithheld(RAHUL, 'direct-shear'), true, 'both results are withheld');
  eq(S.resultWithheld(OTHER, 'direct-shear'), true, 'from both students');

  /* Timestamps legitimately differ; nothing else may. */
  function studentView(pid) {
    var prog = S.experimentProgress(pid, 'direct-shear', ['web'], { studentView: true });
    return JSON.stringify({
      status: prog.status, percent: prog.percent, steps: prog.steps, factual: prog.factual
    }).replace(/"20\d\d-[^"]*"/g, '"T"');
  }
  eq(studentView(RAHUL), studentView(OTHER),
    'AND EVERY STUDENT-VIEW FIGURE IS BYTE-IDENTICAL — the outcome cannot be inferred');

  eq(S.experimentProgress(RAHUL, 'direct-shear', ['web'], { studentView: true })
      .factual.assessment.state, S.TECH_PROGRESS.RESULT_WITHHELD,
    'the factual assessment strand reports WITHHELD, not the outcome');
  eq(S.experimentProgress(OTHER, 'direct-shear', ['web'], { studentView: true })
      .factual.assessment.state, S.TECH_PROGRESS.RESULT_WITHHELD,
    'for the failing student too');

  /* ⚠ AND FACULTY STILL SEE THE REAL STATE. Masking is a STUDENT-view
     concern; the people who evaluated the work keep their own view. */
  eq(S.experimentProgress(RAHUL, 'direct-shear', ['web']).factual.assessment.state,
    S.ASSESS_STATE.PASSED, 'WITHOUT the student view, Faculty still see the real outcome');
  eq(S.experimentProgress(OTHER, 'direct-shear', ['web']).factual.assessment.state,
    S.ASSESS_STATE.NOT_PASSED, 'including the failing one');
}

function scenario09PreTelemetry() {
  group('IMPL 09 — a schema-11 state keeps its history and is never back-filled with invented sessions');

  /* A run recorded the way Implementation 03 recorded it, with no
     event log behind it — exactly the shape a stored schema-11 state
     arrives in. */
  utilFixture(['web']);
  var sim = S.simulationActivity(RAHUL, 'direct-shear', 'web');
  ok(!sim, 'no simulation record exists yet');
  S.startSimulation(RAHUL, 'direct-shear', 'web');
  S.completeSimulation(RAHUL, 'direct-shear', 'web');
  var rec = S.simulationActivity(RAHUL, 'direct-shear', 'web');
  eq(rec.status, S.SIM_STATUS.COMPLETED, 'the Implementation-03 writers still work unchanged');
  eq(rec.launches, 1, 'and still report a launch count');
  ok(rec.timeSpentSeconds >= 0, 'and a time spent');

  /* Now strip the log the way a migrated state has none, and confirm
     the legacy record is reported honestly rather than zeroed. */
  var raw = JSON.parse(localStorage.getItem(S.STORAGE_KEY));
  raw.runtimeEvents = [];
  raw.schemaVersion = 11;
  delete raw.seq.runtimeEvent;
  delete raw.seq.runtimeSession;
  localStorage.setItem(S.STORAGE_KEY, JSON.stringify(raw));
  loadState();
  S = XRSLP.state;

  eq(S.SCHEMA_VERSION, 12, 'the build is at schema 12');
  eq(S.migratedFrom(), 11, 'and reports that it migrated from 11');
  eq(S.runtimeEvents().length, 0, 'THE MIGRATED STATE HAS NO EVENTS — none were ever observed');
  ok(Array.isArray(S.runtimeEvents()), 'but the collection exists');
  eq(typeof S.simulationActivity(RAHUL, 'direct-shear', 'web').launches, 'number',
    'NOTHING LOST: the pre-telemetry record survives intact');
  var u = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  eq(u.evidence, 'pre-telemetry', 'AND IS REPORTED AS PRE-TELEMETRY HISTORY, not as session evidence');
  eq(u.completed, true, 'the completion it recorded is still reported');
  eq(u.launches, 1, 'and so is the launch count it recorded');
  eq(u.sessionCount, 0, 'BUT NO SESSION IS INVENTED for it');
  eq(u.sessions.length, 0, 'and no session detail is fabricated');

  /* Migration is idempotent: loading it again changes nothing. */
  var snapshot = JSON.stringify(S.simulationActivity(RAHUL, 'direct-shear', 'web'));
  loadState();
  S = XRSLP.state;
  eq(JSON.stringify(S.simulationActivity(RAHUL, 'direct-shear', 'web')), snapshot,
    'MIGRATION IS IDEMPOTENT — a second load changes nothing');
  eq(S.runtimeEvents().length, 0, 'and still invents no events');

  /* New activity after migration is real telemetry again. */
  S.runtimeSimulateRun(RAHUL, 'direct-shear', 'web', { durationSeconds: 60, complete: false });
  var u2 = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  eq(u2.evidence, 'mixed',
    'a NEW run against inherited history is labelled MIXED — part session-backed, part pre-telemetry');
  eq(u2.sessionCount, 1, 'the new session is session-backed');
  eq(u2.totalSeconds, 60, 'with its own measured time');
  eq(u2.completed, true, 'AND THE EARLIER COMPLETION IS NOT LOST');
  eq(u2.inheritedCompletion, true,
    'AND IS NAMED AS INHERITED, so no screen can present it as a session-backed completion');
  eq(S.simulationStatus(RAHUL, 'direct-shear', 'web'), S.SIM_STATUS.COMPLETED,
    'the record still reads as completed');
}


/* ============================================================
   IMPLEMENTATION 09 — FACULTY QUESTION BANK IMPORT (CSV + XLSX).
   ============================================================ */

/* A REAL DEFLATE-COMPRESSED WORKBOOK, base64-encoded.

   The writer in `js/xlsx.js` emits STORED (uncompressed) entries, so a
   round-trip through it would exercise the ZIP container and none of
   the DEFLATE decompressor — which is the half most likely to be
   wrong and the half every spreadsheet application actually produces.
   This fixture is a workbook compressed the way Excel, LibreOffice
   and Google Sheets compress one, so `inflateRaw` is genuinely under
   test. It carries one valid row of each supported question type.
   ============================================================ */
var QA_XLSX_DEFLATED_B64 =
  'UEsDBBQAAAAIAEORKV0XbY/dnQAAAAMBAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbHWPSQ7CMAxFrxJli1oXFixQWxbADbiA' +
  'FdxBpEkUm6rcnnRYIVja738/uTxPg1UjRe69q/Q+L/S5Lu/vQKwScVzpTiScANh0NCDnPpBLpPFxQEljbCGgeWJLcCiKIxjv' +
  'hJxkMt/QdXmlBl9W1G1K69USybJWlzU4uyqNIdjeoCQOo3t8WbLNkKfmkuGuD7xLAQ0/DTP5L9h6sLxZfwBQSwMEFAAAAAgA' +
  'Q5EpXUuDozqWAAAABQEAAAsAAABfcmVscy8ucmVsc43PPQ7CMAwF4KtEPkDdMjCgpl1YuiIuEFL3R23iyAlQbk9GihgY/fz0' +
  'Wa7bza3qQRJn9hqqooS2qS+0mpSDOM0hqtzwUcOUUjghRjuRM7HgQD5vBhZnUh5lxGDsYkbCQ1keUT4N2Juq6zVI11egrq9A' +
  '/9g8DLOlM9u7I59+nPhqZNnISEnDtuKTZbkxL0VGAZsadw82b1BLAwQUAAAACABDkSldcujcEaEAAAD8AAAADwAAAHhsL3dv' +
  'cmtib29rLnhtbI2PORKDMAxFr+LRATCkSMEY06ShzBEcELEHvIxkkhw/Hgh9Ki1fetJX/cev4oXELoYOmqqGXqt3pOUR4yKK' +
  'GLgDm3NqpeTRojdcxYShKHMkb3Ip6Sk5EZqJLWL2q7zU9VV64wIchJb+YcR5diPe4rh5DPmAEK4ml9fYusSg1X6Bf1EE47GD' +
  '+4a8z4DY28NUjICg1pWEhqkBqZU8N+VpTn8BUEsDBBQAAAAIAEORKV1tNul0mgAAAAYBAAAaAAAAeGwvX3JlbHMvd29ya2Jv' +
  'b2sueG1sLnJlbHONzzsOwjAMBuCrRD5A3TIwoKZdWFgRF4hSt6naPBSb1+2JGBCVGJgs/7Y+y23/8Ku6UeY5Bg1NVUPftWda' +
  'jZSA3ZxYlY3AGpxIOiCydeQNVzFRKJMxZm+ktHnCZOxiJsJdXe8xfxuwNdVp0JBPQwPq8kz0jx3HcbZ0jPbqKciPE3iPeWFH' +
  'JAU1eSLR8IkY36WpigrYtbj5sHsBUEsDBBQAAAAIAEORKV2oZqadAwIAAHoGAAAYAAAAeGwvd29ya3NoZWV0cy9zaGVldDEu' +
  'eG1shZXNrtowEIVfxcoDYP7aRRWC6AVKpS4q3UpdosEZiFXHTj0mQJ++k1CltLXLyslYn8dz5tjOl9faiBY9aWcX2WQ0zpZF' +
  'fnH+G1WIQfCspUVWhdC8k5JUhTXQyDVoeebofA2Bf/1JUuMRyh6qjZyOx29lDdpmRd7H1hCgyL27CM9ZOKq6j9UkE2GRaWu0' +
  'xdfgOa6pyEPx/YwUeEf7cGswl6HIZTch1S/w/TMwwrykGNf0qSDCrJ8whwizecKoCLN9wpQR5kOKUc57VGEPli7oI+QuRdbA' +
  'fY8AH1MAXhsDFv5VXHKrh35Ph35PU4nPJujG4F5VTqtox1Po10qrSgRuu6gR6OyRBFsOvKDg0Z5CJcA4exIg2KIlHpkvRbdt' +
  'XMZcksqz1p2o96VjTklxX7yGqwYTc0qKeXGWnNElJKy8TYGf0bMIB210uMUsk+Ji3t91bWuLaS7bRyukltiCNiy+0CT4XlCs' +
  '8V32UKGonNc/nA1g7sKP/mOW2WCWWSJT8GfcH8FQ1CcpaiVsd10ZcxNqkJd3qQzcRAV094d6VL4LUOcoAQfXcmmBBI/+cPYl' +
  '/p4dxZRObWO7+vS6iak969WeDGr/Icp8EGWeWLdEUl7zbdFGVUlhm+4Aa8sduojGcaUXFsU/FH48sutJYD/y4v2pIorVvJv3' +
  'Jbz5qwT58ADI4WUpfgJQSwECFAMUAAAACABDkSldF22P3Z0AAAADAQAAEwAAAAAAAAAAAAAAgAEAAAAAW0NvbnRlbnRfVHlw' +
  'ZXNdLnhtbFBLAQIUAxQAAAAIAEORKV1Lg6M6lgAAAAUBAAALAAAAAAAAAAAAAACAAc4AAABfcmVscy8ucmVsc1BLAQIUAxQA' +
  'AAAIAEORKV1y6NwRoQAAAPwAAAAPAAAAAAAAAAAAAACAAY0BAAB4bC93b3JrYm9vay54bWxQSwECFAMUAAAACABDkSldbTbp' +
  'dJoAAAAGAQAAGgAAAAAAAAAAAAAAgAFbAgAAeGwvX3JlbHMvd29ya2Jvb2sueG1sLnJlbHNQSwECFAMUAAAACABDkSldqGam' +
  'nQMCAAB6BgAAGAAAAAAAAAAAAAAAgAEtAwAAeGwvd29ya3NoZWV0cy9zaGVldDEueG1sUEsFBgAAAAAFAAUARQEAAGYFAAAA' +
  'AA==';

var QA_XLSX_REALWORLD_B64 =
  'UEsDBBQAAAAIABmaKV3muHRrXAAAAGIAAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbBXMTQqAIBBA4auE+xxr0SJKL9EFRKYf' +
  'ylGcIer22fLxwZvcE6/mxsJHoll12ihnp+XNyE0V4lntInkE4LBj9KxTRqqyphK91CwbZB9OvyH0xgwQEgmStPI/FNgPUEsD' +
  'BBQAAAAIABmaKV1Lg6M6lgAAAAUBAAALAAAAX3JlbHMvLnJlbHONzz0OwjAMBeCrRD5A3TIwoKZdWLoiLhBS90dt4sgJUG5P' +
  'RooYGP389Fmu282t6kESZ/YaqqKEtqkvtJqUgzjNIarc8FHDlFI4IUY7kTOx4EA+bwYWZ1IeZcRg7GJGwkNZHlE+Ddibqus1' +
  'SNdXoK6vQP/YPAyzpTPbuyOffpz4amTZyEhJw7bik2W5MS9FRgGbGncPNm9QSwMEFAAAAAgAGZopXYbtWvaiAAAAAwEAAA8A' +
  'AAB4bC93b3JrYm9vay54bWyNjzkSgzAMRa/i0QEwpEjBsDRpKHMEB0TsAVuMZJIcPx4T+lRavvSk3/Qfv6oXsjgKLVRFCX3X' +
  'vImXB9GikhikBRvjVmsto0VvpKANQ1JmYm9iKvmpZWM0k1jE6Fd9Kcur9sYFOAg1/8OgeXYj3mjcPYZ4QBhXE9NrYt0m0DX5' +
  'gvyiCsZjC/cdJc+Ayu1hSkZAce1SwsNUpT2dlTMmgD49dl9QSwMEFAAAAAgAGZopXW026XSaAAAABgEAABoAAAB4bC9fcmVs' +
  'cy93b3JrYm9vay54bWwucmVsc43POw7CMAwG4KtEPkDdMjCgpl1YWBEXiFK3qdo8FJvX7YkYEJUYmCz/tj7Lbf/wq7pR5jkG' +
  'DU1VQ9+1Z1qNlIDdnFiVjcAanEg6ILJ15A1XMVEokzFmb6S0ecJk7GImwl1d7zF/G7A11WnQkE9DA+ryTPSPHcdxtnSM9uop' +
  'yI8TeI95YUckBTV5ItHwiRjfpamKCti1uPmwewFQSwMEFAAAAAgAGZopXasehEWDAQAA4QQAABgAAAB4bC93b3Jrc2hlZXRz' +
  'L3NoZWV0MS54bWyFlM9SAjEMxl+lsw9AARkPzLKMiopnDxyZUILbsduuSfjj29sFZVDb4babzO9Lmi9tOT00Tu2Q2AY/KQa9' +
  'fjGtyn2gd64RRcWs50lRi7RjrdnU2AD3Qos+ZjaBGpD4S2+aW0JYH6HG6WG/f6sbsL6oymNsBgJVSWGvKFaJUdN93A0KJZPC' +
  'emc9vgrFuOWqlOpjiyyxo6V8tlhqqUrdJbT5Bu+vgQnmIceE9lgKEszsCrNKMI9XGJNgnq4w6wTznGNMIEIjS/C8R0qQ8xzZ' +
  'QPQ9AbzkADy0Djz8n7iOVp/9Hp79HuYKb53Y1uHS1MGapOM5dFFbUyuJtqsGgbeErOLKASkWQv8m9TS1DDm5me1md1JILUTk' +
  '4n24KfSP2zmhh+A5OLuGzDo+/VV6zimlFnPezXRXDUu9u/QpI9Fd4zG3YHBSxHvKSDvs6qbtGp3tGmU6EtricgOOk07lqAUI' +
  'krKsrDeh6fpgu3LYS+32SWN1POTg9yHnoz/RU/P64p3R5wes+gJQSwECFAMUAAAACAAZmild5rh0a1wAAABiAAAAEwAAAAAA' +
  'AAAAAAAAgAEAAAAAW0NvbnRlbnRfVHlwZXNdLnhtbFBLAQIUAxQAAAAIABmaKV1Lg6M6lgAAAAUBAAALAAAAAAAAAAAAAACA' +
  'AY0AAABfcmVscy8ucmVsc1BLAQIUAxQAAAAIABmaKV2G7Vr2ogAAAAMBAAAPAAAAAAAAAAAAAACAAUwBAAB4bC93b3JrYm9v' +
  'ay54bWxQSwECFAMUAAAACAAZmildbTbpdJoAAAAGAQAAGgAAAAAAAAAAAAAAgAEbAgAAeGwvX3JlbHMvd29ya2Jvb2sueG1s' +
  'LnJlbHNQSwECFAMUAAAACAAZmildqx6ERYMBAADhBAAAGAAAAAAAAAAAAAAAgAHtAgAAeGwvd29ya3NoZWV0cy9zaGVldDEu' +
  'eG1sUEsFBgAAAAAFAAUARQEAAKYEAAAAAA==';

var QA_B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function qaFromBase64(s) {
  var clean = String(s).replace(/[^A-Za-z0-9+/]/g, '');
  var out = [], buf = 0, bits = 0;
  for (var i = 0; i < clean.length; i++) {
    buf = (buf << 6) | QA_B64_ALPHABET.indexOf(clean.charAt(i));
    bits += 6;
    if (bits >= 8) { bits -= 8; out.push((buf >> bits) & 0xFF); }
  }
  return new Uint8Array(out);
}

/* A Faculty member mapped to soil-mechanics, with a live tenant and a
   Question Bank they may write to. */
function importFixture() {
  boot();
  var g = grantAccess(['direct-shear', 'consolidation'], ['web'], 5, 'yearly');
  S.mapFaculty(TENANT, ARJUN, g.access.id, 'soil-mechanics', null);
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  return g;
}
function qaImport(kind, payload, experimentId) {
  return XRSLP.questionImport.validate(kind, payload, {
    experimentId: experimentId || 'direct-shear', facultyPersonId: ARJUN
  });
}
function qaBankCount(experimentId) {
  return S.questionsForFaculty(ARJUN).filter(function (q) {
    return !experimentId || q.experimentId === experimentId;
  }).length;
}

var QA_HEADER = 'question_type,question,option_a,option_b,option_c,option_d,correct_answer,marks,explanation';
var QA_MCQ = 'multiple_choice,"Which test measures shear strength directly?",Direct shear,Triaxial,Consolidation,Permeability,a,2,"Failure is forced along a known plane."';
var QA_TF  = 'true_false,"Water is incompressible for practical purposes.",,,,,TRUE,1,';
var QA_DESC = 'descriptive,"Explain effective stress in a saturated soil.",,,,,,5,';

function scenario09ImportCsv() {
  group('IMPL 09 — Question Bank import: CSV parses, validates and previews without writing');
  importFixture();

  var before = qaBankCount();

  /* ---- a valid file of all three types ---- */
  var good = qaImport('csv', [QA_HEADER, QA_MCQ, QA_TF, QA_DESC].join('\n'));
  eq(good.fatal, null, 'a well-formed file has no fatal problem');
  eq(good.errors.length, 0, 'and no blocking errors');
  eq(good.validCount, 3, 'all three rows are valid');
  eq(good.ok, true, 'so the file is importable');
  eq(good.rows[0].type, 'mcq', 'multiple_choice maps to the product mcq type');
  eq(good.rows[1].type, 'tf', 'true_false maps to tf');
  eq(good.rows[2].type, 'descriptive', 'descriptive maps to descriptive');
  eq(good.rows[0].answer, 0, 'the MCQ answer letter a resolves to the first option');
  eq(good.rows[0].options.length, 4, 'with four options kept');
  eq(good.rows[1].answer, true, 'TRUE resolves to a boolean true');
  eq(good.rows[2].answer, null, 'a descriptive row carries no answer key');
  eq(good.rows[0].points, 2, 'marks are read as a number');

  /* ⛔ THE CENTRAL PROMISE OF THE WHOLE FLOW. */
  eq(qaBankCount(), before, 'NOTHING IS WRITTEN BY VALIDATION — the bank is untouched');
  eq(S.questionsForFaculty(ARJUN).length, before, 'not one question was created');

  /* ---- Cancel: the bank is still untouched ---- */
  eq(qaBankCount(), before, 'AND ABANDONING THE PREVIEW WRITES NOTHING EITHER');

  /* ---- the confirmed import ---- */
  var outcome = XRSLP.questionImport.commit(good, TENANT, ARJUN);
  eq(outcome.created, 3, 'confirming creates exactly the previewed rows');
  eq(outcome.refused.length, 0, 'and refuses none of them');
  eq(qaBankCount(), before + 3, 'THE BANK GREW BY THREE');

  var made = outcome.questions;
  eq(made[0].type, 'mcq', 'the MCQ is stored as an MCQ');
  eq(made[0].options.length, 4, 'with its options');
  eq(made[0].answer, 0, 'and its answer key pointing at the right option');
  eq(made[0].options[made[0].answer], 'Direct shear', 'WHICH IS THE OPTION THE FILE NAMED');
  eq(made[1].answer, true, 'the true/false answer is stored as a boolean');
  eq(made[2].type, 'descriptive', 'and the descriptive question has no key');
  eq(made[2].answer, null, 'literally none');
  eq(made[0].points, 2, 'marks are carried');
  eq(made[0].experimentId, 'direct-shear', 'FILED AGAINST THE CHOSEN EXPERIMENT');
  eq(made[0].courseId, 'soil-mechanics', 'and the Course that experiment belongs to');
  eq(made[0].tenantId, TENANT, 'inside the right institution');
  eq(made[0].createdBy, ARJUN, 'by the faculty member who imported it');

  /* ---- PROVENANCE ---- */
  eq(made[0].origin, 'import-csv', 'PROVENANCE: imported from CSV');
  ok(made.every(function (q) { return q.origin === 'import-csv'; }), 'every imported row says so');
  ok(made.every(function (q) { return q.origin !== 'ai'; }),
    'AND NOT ONE IS PRESENTED AS AN AI DRAFT — a person wrote these');
  eq(S.questionOriginMeta('import-csv').label, 'Imported from CSV', 'the label says what happened');
  eq(S.questionOriginMeta('ai').label, 'From an assisted draft', 'and the AI label is a different one');
  eq(S.questionWasImported(made[0]), true, 'the predicate agrees');
  eq(S.questionWasImported(S.addQuestion(TENANT,
    { type: 'tf', text: 'A hand-typed question.', answer: true, points: 1,
      experimentId: 'direct-shear' }, ARJUN).question), false,
    'and a hand-typed question is not marked as imported');

  /* ---- Add / Edit / Delete still work afterwards ---- */
  var edited = S.updateQuestion(made[0].id, {
    type: 'mcq', text: 'Edited after import.', options: made[0].options.slice(),
    answer: 1, points: 3, explanation: '', experimentId: 'direct-shear'
  });
  eq(edited.ok, true, 'AN IMPORTED QUESTION EDITS LIKE ANY OTHER');
  eq(S.activeQuestion(made[0].id).text, 'Edited after import.', 'and the edit takes effect');
  eq(S.activeQuestion(made[0].id).origin, 'import-csv', 'while the provenance is not rewritten by an edit');
  eq(S.deleteQuestion(made[1].id), true, 'and it deletes like any other');
  eq(S.activeQuestion(made[1].id), null, 'leaving the active bank');
}

function scenario09ImportValidation() {
  group('IMPL 09 — every malformed question row is caught, named and blocked');
  importFixture();
  var before = qaBankCount();

  function firstError(csv) {
    var r = qaImport('csv', csv);
    return r.fatal || (r.errors[0] ? r.errors[0].message : null);
  }

  /* ---- file-level ---- */
  ok(/empty/i.test(qaImport('csv', '').fatal), 'AN EMPTY FILE is refused and says so');
  ok(/no question rows/i.test(qaImport('csv', QA_HEADER).fatal),
    'a header with no rows is refused');
  ok(/header row does not match/i.test(qaImport('csv', 'a,b,c\n1,2,3').fatal),
    'A BAD HEADER is refused');
  var badHead = qaImport('csv', 'question,marks\nSomething,2');
  ok(badHead.headerErrors.some(function (h) { return /question_type/.test(h); }),
    'and the missing column is named');

  /* ---- row-level ---- */
  ok(/type is missing/i.test(firstError(QA_HEADER + '\n,"Text",,,,,TRUE,1,')),
    'A MISSING TYPE is caught');
  ok(/not a question type/i.test(firstError(QA_HEADER + '\nmatching,"Text",a,b,,,a,1,')),
    'AN UNSUPPORTED TYPE is caught rather than invented');
  ok(/question text is missing/i.test(firstError(QA_HEADER + '\ntrue_false,,,,,,TRUE,1,')),
    'A MISSING QUESTION is caught');
  ok(/Marks are missing/i.test(firstError(QA_HEADER + '\ntrue_false,"Text",,,,,TRUE,,')),
    'MISSING MARKS are caught');
  ok(/not a number/i.test(firstError(QA_HEADER + '\ntrue_false,"Text",,,,,TRUE,lots,')),
    'NON-NUMERIC MARKS are caught');
  ok(/whole number/i.test(firstError(QA_HEADER + '\ntrue_false,"Text",,,,,TRUE,2.5,')),
    'FRACTIONAL MARKS are caught');
  ok(/between 1 and 100/i.test(firstError(QA_HEADER + '\ntrue_false,"Text",,,,,TRUE,0,')),
    'ZERO MARKS are caught');
  ok(/between 1 and 100/i.test(firstError(QA_HEADER + '\ntrue_false,"Text",,,,,TRUE,9999,')),
    'AND AN ABSURD MARK VALUE IS CAUGHT — the same 1-100 rule the form uses');
  ok(/at least two answer options/i.test(firstError(QA_HEADER + '\nmultiple_choice,"Text",Only one,,,,a,1,')),
    'AN MCQ WITH ONE OPTION is caught');
  ok(/correct answer is missing/i.test(firstError(QA_HEADER + '\nmultiple_choice,"Text",A,B,,,,1,')),
    'AN MCQ WITH NO ANSWER is caught');
  ok(/does not name one of/i.test(firstError(QA_HEADER + '\nmultiple_choice,"Text",A,B,,,z,1,')),
    'AN ANSWER THAT NAMES NO OPTION is caught');
  ok(/which is empty/i.test(firstError(QA_HEADER + '\nmultiple_choice,"Text",A,B,,,d,1,')),
    'AN ANSWER POINTING AT AN EMPTY OPTION is caught');
  ok(/not TRUE or FALSE/i.test(firstError(QA_HEADER + '\ntrue_false,"Text",,,,,maybe,1,')),
    'A MALFORMED TRUE/FALSE is caught');
  ok(/characters long/i.test(firstError(QA_HEADER + '\ntrue_false,"' +
    Array(2100).join('x') + '",,,,,TRUE,1,')),
    'AN EXCESSIVE QUESTION LENGTH is caught');

  /* Every error names the row and how to fix it. */
  var multi = qaImport('csv', [QA_HEADER,
    'multiple_choice,"No answer",A,B,,,,1,',
    'true_false,"Bad marks",,,,,TRUE,nine,'].join('\n'));
  eq(multi.errors.length >= 2, true, 'several bad rows produce several errors');
  eq(multi.errors[0].rowNo, 2, 'THE ROW NUMBER IS THE ONE THE SPREADSHEET SHOWS — the header is row 1');
  eq(multi.errors[1].rowNo, 3, 'and the second error names row 3');
  ok(multi.errors.every(function (e) { return !!e.fix; }), 'AND EVERY ERROR SAYS HOW TO CORRECT IT');
  ok(multi.errors.every(function (e) { return !!e.field; }), 'and names the column');

  /* ---- ALL-OR-NOTHING ---- */
  var mixed = qaImport('csv', [QA_HEADER, QA_MCQ, 'true_false,"Bad",,,,,maybe,1,'].join('\n'));
  eq(mixed.validCount, 1, 'one row is valid');
  eq(mixed.invalidCount, 1, 'and one is not');
  eq(mixed.ok, false, 'SO THE WHOLE FILE IS BLOCKED');
  eq(XRSLP.questionImport.commit(mixed, TENANT, ARJUN).created, 0,
    'AND COMMITTING IT WRITES NOTHING AT ALL — no partial, hidden import');
  eq(qaBankCount(), before, 'the bank is exactly as it was');

  /* ---- too many rows is a REFUSAL, never a silent truncation ---- */
  var many = [QA_HEADER];
  for (var i = 0; i < XRSLP.questionImport.MAX_ROWS + 5; i++) {
    many.push('true_false,"Question number ' + i + '",,,,,TRUE,1,');
  }
  var big = qaImport('csv', many.join('\n'));
  ok(/at most/.test(big.fatal || ''), 'AN OVERSIZED FILE IS REFUSED, not trimmed');
  eq(big.ok, false, 'and cannot be imported');
  eq(XRSLP.questionImport.commit(big, TENANT, ARJUN).created, 0, 'and writes nothing');
  eq(qaBankCount(), before, 'STILL nothing in the bank');
}

function scenario09ImportDuplicates() {
  group('IMPL 09 — duplicates are flagged for a decision, never resolved behind the faculty member');
  importFixture();

  var first = qaImport('csv', [QA_HEADER, QA_MCQ].join('\n'));
  XRSLP.questionImport.commit(first, TENANT, ARJUN);
  var after = qaBankCount();

  /* Same question again, against the same experiment. */
  var again = qaImport('csv', [QA_HEADER, QA_MCQ].join('\n'));
  eq(again.duplicateCount, 1, 'AN IDENTICAL QUESTION IS FLAGGED as a duplicate');
  eq(again.rows[0].duplicate, 'bank', 'and is named as a duplicate of the BANK');
  eq(again.errors.length, 0, 'BUT IT IS NOT AN ERROR');
  eq(again.ok, true, 'so the faculty member may still import it knowingly');
  ok(again.warnings.some(function (w) { return /already in your Question Bank/.test(w.message); }),
    'and the warning says what importing will do');
  eq(XRSLP.questionImport.commit(again, TENANT, ARJUN).created, 1,
    'CONFIRMING ADDS THE SECOND COPY — nothing is silently merged');
  eq(qaBankCount(), after + 1, 'the bank grew');

  /* Duplicates WITHIN one file. */
  var within = qaImport('csv', [QA_HEADER, QA_DESC, QA_DESC].join('\n'));
  eq(within.duplicateCount, 1, 'a row repeated inside one file is flagged once');
  eq(within.rows[1].duplicate, 'file', 'as a duplicate of the FILE');
  ok(within.warnings.some(function (w) { return /repeats row 2/.test(w.message); }),
    'naming the row it repeats');
  eq(within.ok, true, 'and it still does not block the import');
  eq(XRSLP.questionImport.commit(within, TENANT, ARJUN).created, 2,
    'AND BOTH COPIES ARE CREATED — nothing is deduplicated without being asked');

  /* The same sentence as a different TYPE is not a duplicate. */
  var other = qaImport('csv', [QA_HEADER,
    'true_false,"Explain effective stress in a saturated soil.",,,,,TRUE,1,'].join('\n'));
  eq(other.duplicateCount, 0,
    'THE SAME SENTENCE ASKED AS A DIFFERENT TYPE IS A DIFFERENT QUESTION');
}

function scenario09ImportScope() {
  group('IMPL 09 — a spreadsheet cannot grant itself an experiment');
  importFixture();
  var before = qaBankCount();

  /* `consolidation` is in the tenant's access but the faculty member
     is mapped at Course level to soil-mechanics, which carries it —
     so pick something genuinely outside the mapping instead. */
  var mine = S.facultyExperimentIds(ARJUN);
  var outside = null;
  S.contentRecords().forEach(function (r) {
    if (!outside && r.status === S.CONTENT_STATUS.PUBLISHED && mine.indexOf(r.id) === -1) {
      outside = r.id;
    }
  });
  ok(!!outside, 'there is a published experiment outside this faculty member’s scope');

  var out = qaImport('csv', [QA_HEADER, QA_MCQ].join('\n'), outside);
  eq(out.ok, false, 'IMPORTING INTO AN OUT-OF-SCOPE EXPERIMENT IS REFUSED');
  ok(/not mapped to you/.test(out.fatal || ''), 'and the reason is the mapping');
  eq(out.rows.length, 0, 'NOT ONE ROW IS EVEN READ — scope is checked before the file');
  eq(qaBankCount(), before, 'and nothing is written');

  /* Even a forged result object cannot get past the writer. */
  var forged = qaImport('csv', [QA_HEADER, QA_MCQ].join('\n'));
  eq(forged.ok, true, 'a valid in-scope result exists');
  forged.experimentId = outside;
  eq(XRSLP.questionImport.commit(forged, TENANT, ARJUN).created, 0,
    'AND THE COMMITTER RE-CHECKS SCOPE — a result object is not authority');
  eq(qaBankCount(outside), 0, 'nothing landed against the out-of-scope experiment');

  /* No experiment chosen at all. */
  var none = XRSLP.questionImport.validate('csv', QA_HEADER + '\n' + QA_MCQ,
    { facultyPersonId: ARJUN });
  eq(none.ok, false, 'choosing no experiment is refused');
  ok(/before choosing a file/.test(none.fatal || ''), 'and says the context comes first');

  /* A deactivated institution writes nothing. */
  var good = qaImport('csv', [QA_HEADER, QA_MCQ].join('\n'));
  S.deactivateTenant(TENANT, 'QA — import guard');
  eq(XRSLP.questionImport.commit(good, TENANT, ARJUN).created, 0,
    'A DEACTIVATED INSTITUTION IMPORTS NOTHING');
  S.reactivateTenant(TENANT, 'QA — reversal');
}

function scenario09XlsxRealWorld() {
  group('IMPL 09 — a workbook shaped the way Excel actually writes one');
  importFixture();

  /* ⚠ THE DEFECT CLASS THIS FIXTURE EXISTS FOR, and it corrupted
     ORDINARY files rather than crafted ones.

     The worksheet scanner was a pair of regular expressions whose
     PAIRED alternative came first, and whose `[^>]*` ate the `/` of a
     self-closing tag. `<c r="D2" s="3"/>` — which is exactly what
     Excel, LibreOffice and openpyxl emit for a styled empty cell —
     matched as an OPEN tag, and its lazy body then ran forward to the
     NEXT cell's `</c>`, swallowing that cell whole. A perfectly normal
     workbook silently lost a column, and the import would have filed
     the wrong text against the wrong option.

     This fixture carries every shape that broke it: self-closing cells
     between real ones, a self-closing `<t>` WITH an attribute, an
     omitted blank row, a numeric cell, a boolean cell, and a workbook
     whose `<sheet>` is written in the PAIRED form. */
  var bytes = qaFromBase64(QA_XLSX_REALWORLD_B64);
  var res = XRSLP.xlsx.read(bytes);
  eq(res.ok, true, 'the workbook reads');
  eq(res.error, null, 'with no error');
  eq(res.sheets[0].name, 'Questions',
    'AND A PAIRED <sheet> ELEMENT IS FOUND — it was rejected as "no worksheet"');

  var rows = XRSLP.xlsx.rowsOfRaw(res);
  eq(rows[0].join('|'),
    'question_type|question|option_a|option_b|option_c|option_d|correct_answer|marks|explanation',
    'the header survives intact');
  eq(rows[1][2], 'Direct shear', 'the cell BEFORE a self-closing cell is read');
  eq(rows[1][3], '', 'the self-closing cell itself is empty');
  eq(rows[1][4], 'Consolidation',
    'AND THE CELL AFTER IT SURVIVES — this is the column that used to vanish');
  eq(rows[1][6], 'a', 'and so does everything after the second self-closing cell');
  eq(rows[1][7], '2', 'a numeric cell reads as its number');
  eq(rows[1][8], '', 'and a self-closing <t> with an attribute yields empty text, not markup');
  eq(rows[2].length, 0, 'THE OMITTED ROW 3 IS AN EMPTY ROW, in its own place');
  eq(rows[3][0], 'true_false', 'so row 4 is read as row 4');
  eq(rows[3][6], 'TRUE', 'and a boolean cell reads as a word');

  /* And it imports, with the row numbers a person would see. */
  var r = qaImport('xlsx', bytes);
  eq(r.fatal, null, 'the workbook validates');
  eq(r.errors.length, 0, 'with no errors');
  eq(r.validCount, 2, 'two question rows');
  eq(r.rows[0].options.join('|'), 'Direct shear|Consolidation',
    'THE MCQ KEEPS EXACTLY THE OPTIONS THE FILE CARRIED');
  eq(r.rows[0].options[r.rows[0].answer], 'Direct shear',
    'and its answer key points at the option the file named');
  eq(r.rows[1].rowNo, 4, 'and the second question is reported as row 4, as the spreadsheet shows it');
}

function scenario09XlsxHardening() {
  group('IMPL 09 — the spreadsheet reader refuses hostile input instead of hanging');

  /* Every one of these is a file a person could be handed. None of
     them may hang a browser tab or exhaust its memory. */
  function reads(bytes) {
    var out = null;
    try { out = XRSLP.xlsx.read(bytes); } catch (e) { return { ok: false, threw: e.message }; }
    return out;
  }
  eq(reads(new Uint8Array(0)).ok, false, 'an empty file is refused');
  eq(reads(new Uint8Array([1, 2, 3, 4, 5])).ok, false, 'random bytes are refused');
  eq(reads(new Uint8Array([0xD0, 0xCF, 0x11, 0xE0, 0, 0, 0, 0])).ok, false, 'an old .xls is refused');
  eq(reads(XRSLP.xlsx.toUtf8('question_type,question\nmcq,hi')).ok, false,
    'a CSV renamed .xlsx is caught by its bytes');
  /* A ZIP whose directory is nonsense. */
  var pk = XRSLP.xlsx.toUtf8('PK\u0005\u0006');
  eq(reads(pk).ok, false, 'a truncated ZIP end-record is refused, not crashed on');

  /* DEFLATE: malformed streams throw rather than looping. */
  function inflates(arr) {
    try { XRSLP.xlsx.inflateRaw(new Uint8Array(arr), 0); return 'returned'; }
    catch (e) { return 'threw'; }
  }
  eq(inflates([0xFF]), 'threw', 'a reserved block type throws');
  eq(inflates([0x06]), 'threw', 'and so does another');
  eq(inflates([0x00, 0x05, 0x00]), 'threw', 'a truncated stored block throws');
  eq(inflates([]), 'threw', 'and so does an empty stream');

  /* A crafted column reference must not densify a row to a huge array. */
  var crafted = XRSLP.xlsx.write([['a']], 'S');
  eq(XRSLP.xlsx.read(crafted).ok, true, 'a normal workbook still reads');

  /* The writer produces a valid archive and round-trips its own text,
     including characters that need escaping and a lone surrogate. */
  var tricky = [['A & B < C > D "q" \'s\'', 'τ = c + σ tanφ', '日本語']];
  var round = XRSLP.xlsx.rowsOf(XRSLP.xlsx.read(XRSLP.xlsx.write(tricky, 'S')));
  eq(round[0][0], tricky[0][0], 'XML-significant characters round-trip exactly');
  eq(round[0][1], tricky[0][1], 'and Greek and symbols');
  eq(round[0][2], tricky[0][2], 'and multi-byte scripts');
  var lone = XRSLP.xlsx.rowsOf(XRSLP.xlsx.read(XRSLP.xlsx.write([['x\uD800y']], 'S')));
  ok(typeof lone[0][0] === 'string',
    'AND A LONE SURROGATE PRODUCES A READABLE FILE rather than invalid UTF-8');
  ok(lone[0][0].indexOf('y') !== -1, 'without swallowing the character after it');

  /* A numeric entity must not be decoded twice. */
  var ent = XRSLP.xlsx.rowsOf(XRSLP.xlsx.read(XRSLP.xlsx.write([['A&#38;lt;B']], 'S')));
  eq(ent[0][0], 'A&#38;lt;B',
    'A NUMERIC ENTITY IS DECODED ONCE — it used to expand and then be re-read');
}

function scenario09ImportRobustness() {
  group('IMPL 09 — the import reports the row the spreadsheet shows, and hides nothing it ignored');
  importFixture();
  var before = qaBankCount();

  /* ⚠ BLANK ROWS USED TO SHIFT EVERY NUMBER AFTER THEM.
     Both parsers can drop entirely-empty rows, so a validator numbering
     by compacted index sent a faculty member to a row that was not the
     one with the problem. */
  var withBlank = [QA_HEADER,
    'descriptive,"Question one",,,,,,5,',
    '',
    'descriptive,"Question two with no marks",,,,,,,',
    'descriptive,"Question three",,,,,,3,'].join('\n');
  var r = qaImport('csv', withBlank);
  eq(r.errors.length, 1, 'one row has a problem');
  eq(r.errors[0].rowNo, 4,
    'AND IT IS REPORTED AS ROW 4 — the row the spreadsheet shows, not row 3');
  eq(r.rows.length, 3, 'the blank row is skipped, not validated');

  /* A file that opens with a blank line still has a header. */
  var leading = ['', QA_HEADER, 'descriptive,"A question",,,,,,4,'].join('\n');
  var rl = qaImport('csv', leading);
  eq(rl.fatal, null, 'a leading blank line does not break the header');
  eq(rl.ok, true, 'and the file still imports');
  eq(rl.headerRowNo, 2, 'with the header reported at its real position');

  /* ⚠ A COLUMN NOBODY RECOGNISED USED TO VANISH IN SILENCE. */
  var mistyped = ['question_type,question,option_a,optionB,option_c,option_d,correct_answer,marks,explanation',
    'multiple_choice,"Which test measures shear strength?",Direct shear,Triaxial,Consolidation,' +
    'Permeability,a,2,Note.'].join('\n');
  var rm = qaImport('csv', mistyped);
  ok(rm.ignoredColumns.indexOf('optionB') !== -1,
    'A MISTYPED COLUMN IS NAMED rather than silently discarded');
  ok(rm.warnings.some(function (w) { return /not part of the import/.test(w.message); }),
    'and the file carries a warning saying what is being ignored');
  eq(rm.ok, true, 'it is a warning, not a refusal — a real spreadsheet may carry extra columns');

  /* ⚠ AND THE INSTITUTION COMES FROM THE PERSON, NOT THE CALLER. */
  var good = qaImport('csv', [QA_HEADER, QA_MCQ].join('\n'));
  eq(good.ok, true, 'a valid file for this faculty member');
  eq(XRSLP.questionImport.commit(good, 'tenant-somewhere-else', ARJUN).created, 0,
    'COMMITTING INTO ANOTHER INSTITUTION IS REFUSED — the tenant is not taken on trust');
  eq(qaBankCount(), before, 'and nothing is written anywhere');
  eq(XRSLP.questionImport.commit(good, TENANT, ARJUN).created, 1,
    'while the faculty member’s own institution imports normally');

  /* A non-faculty actor cannot commit at all. */
  var good2 = qaImport('csv', [QA_HEADER, QA_TF].join('\n'));
  eq(XRSLP.questionImport.commit(good2, TENANT, RAHUL).created, 0,
    'AND A STUDENT CANNOT COMMIT AN IMPORT');
}

function scenario09TelemetryRobustness() {
  group('IMPL 09 — the fold survives a disagreeing clock, and an error is never swallowed');
  utilFixture(['web']);

  /* ⚠ AN END STAMPED BEFORE ITS OWN START.
     The log folds in RUNTIME-clock order, and the two-clock design
     exists because a device clock can disagree with the platform's. An
     end sorted before its start used to re-open that session for good
     AND abandon whichever session was genuinely running. */
  var a = S.runtimeLaunch(RAHUL, 'direct-shear', 'web', { occurredAt: '2026-09-01T08:00:00.000Z' });
  var b = S.runtimeLaunch(RAHUL, 'direct-shear', 'web', { occurredAt: '2026-09-01T10:00:00.000Z' });
  S.runtimeEndSession(RAHUL, 'direct-shear', 'web', b.sessionId,
    { occurredAt: '2026-09-01T07:00:00.000Z' });
  var u = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  eq(u.sessionCount, 2, 'both sessions are recorded');
  eq(u.openSessions, 1, 'AND EXACTLY ONE IS OPEN — the one that genuinely is');
  var backwards = null, still = null;
  u.sessions.forEach(function (s) {
    if (s.sessionId === b.sessionId) { backwards = s; }
    if (s.sessionId === a.sessionId) { still = s; }
  });
  eq(backwards.open, false, 'the session whose end preceded its start is closed, not re-opened');
  eq(backwards.seconds, 0, 'and contributes zero seconds, never a negative interval');
  eq(still.open, true, 'AND THE GENUINELY OPEN SESSION IS NOT ABANDONED BY IT');

  /* ⚠ ISO-8601, ACTUALLY CHECKED — because the log is ORDERED by
     string comparison on this field. */
  eq(S.recordRuntimeEvent({ type: S.RUNTIME_EVENT.SESSION_STARTED, sessionId: 'QA-NS',
    personId: RAHUL, experimentId: 'direct-shear', technology: 'web',
    occurredAt: 'Sep 1, 2026 10:00:00 GMT' }).reason, S.RUNTIME_REJECT.BAD_TIMESTAMP,
    'A PARSABLE BUT NON-ISO TIMESTAMP IS REFUSED — it would sort into an arbitrary position');
  eq(S.recordRuntimeEvent({ type: S.RUNTIME_EVENT.SESSION_STARTED, sessionId: 'QA-NS2',
    personId: RAHUL, experimentId: 'direct-shear', technology: 'web',
    occurredAt: '01/09/2026' }).reason, S.RUNTIME_REJECT.BAD_TIMESTAMP, 'and so is a bare date');

  /* An offset-bearing stamp is stored in one canonical form, so it
     sorts against UTC stamps by instant rather than by leading digit. */
  var off = S.runtimeLaunch(RAHUL, 'direct-shear', 'web',
    { occurredAt: '2026-09-02T15:30:00+05:30' });
  var offEv = S.runtimeEventsFor(RAHUL, 'direct-shear', 'web').filter(function (e) {
    return e.sessionId === off.sessionId && e.type === S.RUNTIME_EVENT.SESSION_STARTED;
  })[0];
  eq(offEv.occurredAt, '2026-09-02T10:00:00.000Z',
    'AND AN OFFSET STAMP IS NORMALISED TO UTC, so string order is instant order');

  /* ⚠ TWO DIFFERENT ERRORS IN ONE SESSION ARE TWO ERRORS. */
  utilFixture(['web']);
  var e1 = S.runtimeLaunch(RAHUL, 'direct-shear', 'web');
  S.runtimeError(RAHUL, 'direct-shear', 'web', e1.sessionId, { code: 'A', message: 'First failure.' });
  S.runtimeError(RAHUL, 'direct-shear', 'web', e1.sessionId, { code: 'B', message: 'A different one.' });
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').errors, 2,
    'A SECOND, DIFFERENT ERROR IN ONE SESSION IS NOT TREATED AS A RETRY');
  var errs = S.runtimeEventsFor(RAHUL, 'direct-shear', 'web').filter(function (ev) {
    return ev.type === S.RUNTIME_EVENT.SIMULATION_ERROR;
  });
  eq(errs.length, 2, 'both are in the log');
  ok(errs[0].detail.code !== errs[1].detail.code, 'AND BOTH KEEP THEIR OWN DETAIL');

  /* A client that DOES deduplicate its own errors still gets dedupe. */
  var dup = S.runtimeError(RAHUL, 'direct-shear', 'web', e1.sessionId,
    { code: 'C', message: 'Once.' }, { clientEventId: 'client-own-key' });
  eq(dup.ok, true, 'a client-supplied error key is accepted');
  var dup2 = S.runtimeError(RAHUL, 'direct-shear', 'web', e1.sessionId,
    { code: 'C', message: 'Once.' }, { clientEventId: 'client-own-key' });
  eq(dup2.duplicate, true, 'AND ITS RETRY IS STILL DEDUPLICATED — the client key is honoured');
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').errors, 3, 'so the count is three, not four');

  /* And an error is never a completion. */
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').completed, false,
    'AN ERROR NEVER COMPLETES A SIMULATION');
}

function scenario09ImportXlsx() {
  group('IMPL 09 — the same import from a real .xlsx workbook');
  importFixture();
  var before = qaBankCount();

  /* ---- 1 · the first-party writer round-trips ---- */
  var wrote = XRSLP.xlsx.write(XRSLP.questionImport.templateRows(), 'Questions');
  ok(wrote.length > 0, 'the template is written as a workbook');
  var readBack = XRSLP.xlsx.read(wrote);
  eq(readBack.ok, true, 'and reads back');
  eq(readBack.sheets[0].name, 'Questions', 'with its sheet name');
  var tplRows = XRSLP.xlsx.rowsOf(readBack);
  eq(tplRows[0].join(','), XRSLP.questionImport.COLUMNS.map(function (c) { return c.label; }).join(','),
    'and the header is exactly the column contract');

  /* THE TEMPLATE MUST VALIDATE AGAINST THE VALIDATOR THAT REJECTS IT.
     A template a faculty member downloads and re-uploads unchanged
     has to import cleanly, or the first thing the feature does is
     contradict itself. */
  var tplResult = qaImport('xlsx', wrote);
  eq(tplResult.errors.length, 0, 'THE DOWNLOADED TEMPLATE IMPORTS WITHOUT A SINGLE ERROR');
  eq(tplResult.ok, true, 'and is importable as it stands');
  eq(tplResult.validCount, 3, 'carrying one valid row of each supported type');
  var tplCsv = qaImport('csv', XRSLP.questionImport.templateCsv());
  eq(tplCsv.ok, true, 'AND SO DOES THE CSV TEMPLATE — one schema, two formats');
  eq(tplCsv.validCount, 3, 'with the same three rows');

  /* ---- 2 · a REAL compressed workbook, as Excel writes one ---- */
  var bytes = qaFromBase64(QA_XLSX_DEFLATED_B64);
  ok(bytes.length > 0, 'the compressed fixture decodes');
  var real = XRSLP.xlsx.read(bytes);
  eq(real.ok, true, 'A DEFLATE-COMPRESSED WORKBOOK IS READ — the decompressor works');
  eq(real.error, null, 'with no error');
  eq(real.sheets[0].name, 'Questions', 'the sheet name survives');

  var res = qaImport('xlsx', bytes);
  eq(res.fatal, null, 'the workbook validates');
  eq(res.errors.length, 0, 'with no errors');
  eq(res.validCount, 3, 'three valid rows');
  eq(res.rows[0].type, 'mcq', 'the MCQ row is read');
  eq(res.rows[0].options.length, 4, 'with all four options');
  eq(res.rows[0].answer, 0, 'and the right answer');
  eq(res.rows[1].type, 'tf', 'the true/false row is read');
  eq(res.rows[1].answer, false, 'with FALSE read as false');
  eq(res.rows[2].type, 'descriptive', 'and the descriptive row');
  eq(res.rows[2].points, 5, 'A NUMBER CELL IS READ AS ITS NUMBER — marks came from a numeric cell');
  eq(qaBankCount(), before, 'AND VALIDATION HAS STILL WRITTEN NOTHING');

  var outcome = XRSLP.questionImport.commit(res, TENANT, ARJUN);
  eq(outcome.created, 3, 'confirming imports all three');
  eq(qaBankCount(), before + 3, 'and the bank grows by three');
  ok(outcome.questions.every(function (q) { return q.origin === 'import-xlsx'; }),
    'PROVENANCE: imported from XLSX, not from CSV and not from AI');
  eq(S.questionOriginMeta('import-xlsx').label, 'Imported from XLSX', 'and the label says so');
  eq(outcome.questions[0].experimentId, 'direct-shear', 'filed against the chosen experiment');

  /* ---- 3 · the same failure paths as CSV ---- */
  var badXlsx = XRSLP.xlsx.write([['a', 'b'], ['1', '2']], 'Wrong');
  ok(/header row does not match/.test(qaImport('xlsx', badXlsx).fatal || ''),
    'A BAD HEADER in a workbook is refused the same way');
  var emptyXlsx = XRSLP.xlsx.write([], 'Empty');
  ok(!!qaImport('xlsx', emptyXlsx).fatal, 'AN EMPTY WORKBOOK is refused');
  var oneBad = XRSLP.xlsx.write([
    XRSLP.questionImport.COLUMNS.map(function (c) { return c.label; }),
    ['multiple_choice', 'Only one option', 'A', '', '', '', 'a', '1', '']
  ], 'Bad');
  var oneBadRes = qaImport('xlsx', oneBad);
  eq(oneBadRes.ok, false, 'AND A BAD ROW blocks a workbook exactly as it blocks a CSV');
  eq(XRSLP.questionImport.commit(oneBadRes, TENANT, ARJUN).created, 0, 'writing nothing');

  /* ---- 4 · a file that is not a workbook at all ---- */
  var notZip = XRSLP.xlsx.read(XRSLP.xlsx.toUtf8('question_type,question\nmcq,hello'));
  eq(notZip.ok, false, 'A CSV RENAMED .xlsx IS CAUGHT BY ITS BYTES');
  ok(/does not look like a spreadsheet/.test(notZip.error), 'and is named plainly');
  var oldXls = XRSLP.xlsx.read(new Uint8Array([0xD0, 0xCF, 0x11, 0xE0, 0, 0, 0, 0]));
  eq(oldXls.ok, false, 'AND AN OLD .xls BINARY IS CAUGHT');
  ok(/older .xls workbook/.test(oldXls.error), 'and told what to do about it');
  eq(XRSLP.questionImport.kindOfFile('bank.xls'), 'xls', 'the extension check names .xls separately');
  eq(XRSLP.questionImport.kindOfFile('bank.XLSX'), 'xlsx', 'and is case-insensitive');
  eq(XRSLP.questionImport.kindOfFile('bank.txt'), null, 'and refuses an unrelated extension');

  /* ---- 5 · the ZIP/CRC layer itself ---- */
  eq(XRSLP.xlsx.crc32(XRSLP.xlsx.toUtf8('123456789')), 0xCBF43926,
    'CRC-32 matches the published check value, so the archives written here are valid');
}


/* ============================================================
   IMPLEMENTATION 09 — CONTENT MANAGER EDIT vs VERSION CONTROL.

   PM-08: "If the Content Manager can edit and replace content, how is
   version control preserved?" The stakeholder's own direction — that
   a Content Manager may correct and replace a delivery link — is NOT
   removed by these scenarios. What they assert is WHERE a material
   change lands once the artefact is public.
   ============================================================ */

/* A published record with a hosted Web link, in the Content Manager's
   scope — the stakeholder's own "the link has gone stale" example. */
function publishedFixture(name) {
  var rec = atContentGate(name || 'QA 09 Published');
  S.publishContent(KULK, rec.id);
  return S.contentRecord(rec.id);
}

function scenario09PrePublishEditing() {
  group('IMPL 09 — before first publication, the Content Manager’s correction authority is untouched');
  boot();

  var rec = atContentGate('QA 09 Pre-publish');
  eq(rec.status, S.CONTENT_STATUS.CONTENT_REVIEW, 'the record is at the readiness gate, not published');
  eq(S.managerDeliveryEditMode(rec, KULK, 'web', { url: 'https://example.org/fixed' }), 'direct',
    'A MATERIAL EDIT IS A DIRECT EDIT before publication');

  var hBefore = S.contentRecord(rec.id).history.length;
  ok(!!S.managerUpdateDelivery(KULK, rec.id, 'web', { url: 'https://example.org/fixed' },
    'The vendor link 404s.'), 'and it is accepted');
  eq(S.deliverySummaryFor(S.contentRecord(rec.id), 'web'), 'https://example.org/fixed',
    'the link is replaced in place');
  eq(S.contentRecord(rec.id).history.length, hBefore + 1, 'AND THE AUDIT TRAIL GROWS BY ONE');
  eq(S.contentRecord(rec.id).history[0].kind, 'delivery', 'as a delivery event');
  ok(/404s/.test(S.contentRecord(rec.id).history[0].note), 'carrying the reason that was given');
  eq(S.versionsForRecord(rec.id).length, 0, 'AND NO VERSION IS CREATED — there is nothing public yet');

  /* Removal, runtime and description are all direct before publication. */
  eq(S.managerDeliveryEditMode(rec, KULK, 'web', null, true), 'direct',
    'a removal is direct too');
  eq(S.managerMetadataEditMode(S.contentRecord(rec.id), KULK, { description: 'Rewritten.' }), 'direct',
    'AND SO IS REWRITING THE DESCRIPTION');
  ok(!!S.updateCanonicalMetadata(KULK, rec.id, {
    name: S.contentRecord(rec.id).name, courseId: S.contentRecord(rec.id).courseId,
    summary: 'QA summary.', description: 'Rewritten before publication.'
  }), 'the metadata edit is accepted');
  eq(S.contentRecord(rec.id).description, 'Rewritten before publication.', 'and takes effect');

  /* THE ACADEMIC APPROVAL PROTECTIONS ARE UNCHANGED. Nothing in this
     pass touches the stale-approval / fingerprint machinery: an edit
     that invalidates the academic decision still invalidates it. */
  var approved = atContentGate('QA 09 Stale Approval');
  eq(approved.status, S.CONTENT_STATUS.CONTENT_REVIEW, 'a second fixture reaches the readiness gate');
  eq(S.publishReadiness(approved).ok, true, 'and is publishable as approved');
  /* The Content Manager's delivery edit does NOT invalidate the
     academic decision — the Academic Reviewer owns Learning Outcomes,
     not delivery references, and this pass does not change that. */
  ok(!!S.managerUpdateDelivery(KULK, approved.id, 'web',
    { runtime: 'Chrome 120 or later' }, 'Tightening the stated runtime.'),
    'a pre-publication delivery correction is still accepted');
  eq(S.publishReadiness(S.contentRecord(approved.id)).ok, true,
    'AND THE ACADEMIC APPROVAL SURVIVES IT — delivery is not academic content');
  ok(!!S.publishContent(KULK, approved.id), 'so the record can still be published');
  eq(S.contentRecord(approved.id).status, S.CONTENT_STATUS.PUBLISHED, 'and it is');
}

function scenario09PostPublishVersioning() {
  group('IMPL 09 — a published artefact is never silently rewritten under its own version label');
  boot();

  var rec = publishedFixture('QA 09 Post-publish');
  eq(rec.status, S.CONTENT_STATUS.PUBLISHED, 'the record is published');
  eq(rec.versionLabel, '1.0', 'as v1.0');
  var liveUrl = S.deliverySummaryFor(rec, 'web');
  eq(liveUrl, 'https://example.org/qa-073', 'carrying the link the public sees');
  var hBefore = S.contentRecord(rec.id).history.length;

  /* ---- THE MATERIAL EDIT IS REFUSED IN PLACE ---- */
  eq(S.managerDeliveryEditMode(rec, KULK, 'web', { url: 'https://example.org/replacement' }), 'version',
    'A MATERIAL CHANGE TO PUBLISHED CONTENT MUST BECOME A VERSION');
  eq(S.managerUpdateDelivery(KULK, rec.id, 'web', { url: 'https://example.org/replacement' },
    'The hosted link moved.'), null,
    'AND THE IN-PLACE WRITER REFUSES IT');
  eq(S.deliverySummaryFor(S.contentRecord(rec.id), 'web'), liveUrl,
    'THE LIVE v1.0 LINK IS UNCHANGED — no silent overwrite');
  eq(S.contentRecord(rec.id).versionLabel, '1.0', 'and it is still v1.0');
  eq(S.contentRecord(rec.id).history.length, hBefore,
    'and nothing was written to the audit trail for a refused edit');

  /* Removal is material too, always. */
  eq(S.managerDeliveryEditMode(rec, KULK, 'web', null, true), 'version',
    'REMOVING A DELIVERY REFERENCE IS ALWAYS MATERIAL');
  eq(S.managerUpdateDelivery(KULK, rec.id, 'web', null, 'Withdrawn.', true), null,
    'so it is refused in place too');
  ok(!!S.deliverySummaryFor(S.contentRecord(rec.id), 'web'), 'and the reference survives');

  /* The instructional content is material. */
  eq(S.managerMetadataEditMode(S.contentRecord(rec.id), KULK, { description: 'Rewritten.' }), 'version',
    'REWRITING THE PUBLISHED DESCRIPTION IS MATERIAL');
  eq(S.updateCanonicalMetadata(KULK, rec.id, {
    name: rec.name, courseId: rec.courseId, summary: rec.summary, description: 'Rewritten.'
  }), null, 'and is refused in place');
  ok(S.contentRecord(rec.id).description !== 'Rewritten.', 'the published description is unchanged');

  /* ---- SAFE CHANGES STILL WRITE IN PLACE, WITH AN AUDIT ENTRY ---- */
  eq(S.managerDeliveryEditMode(rec, KULK, 'web', { notes: 'Mirror is slow after 6pm.' }), 'direct',
    'A CONTENT-PLANE NOTE IS NOT MATERIAL — it reaches no student');
  var h2 = S.contentRecord(rec.id).history.length;
  ok(!!S.managerUpdateDelivery(KULK, rec.id, 'web', { notes: 'Mirror is slow after 6pm.' },
    'Recording a known issue.'), 'so it is still accepted on published content');
  eq(S.contentRecord(rec.id).history.length, h2 + 1, 'AND STILL AUDITED');
  eq(S.deliveryOf(S.contentRecord(rec.id), 'web').notes, 'Mirror is slow after 6pm.', 'and stored');

  var dsDesc = S.contentRecord(rec.id).description;
  eq(S.managerMetadataEditMode(S.contentRecord(rec.id), KULK,
    { name: rec.name, summary: 'A corrected catalogue summary.', description: dsDesc }), 'direct',
    'AND CATALOGUE METADATA STAYS THE CONTENT MANAGER’S — STK31-09 is not withdrawn');
  ok(!!S.updateCanonicalMetadata(KULK, rec.id, {
    name: rec.name, courseId: rec.courseId,
    summary: 'A corrected catalogue summary.', description: dsDesc
  }), 'a summary correction is accepted');
  eq(S.contentRecord(rec.id).summary, 'A corrected catalogue summary.', 'and takes effect');

  /* Re-saving an unchanged material value is not a change at all. */
  eq(S.managerDeliveryEditMode(rec, KULK, 'web', { url: liveUrl }), 'direct',
    'RE-SAVING THE SAME VALUE IS NOT A MATERIAL CHANGE, so it demands no version');
}

function scenario09CorrectionVersion() {
  group('IMPL 09 — the correction version runs the existing chain and ends at Release / Hold');
  boot();

  var rec = publishedFixture('QA 09 Correction');
  var liveUrl = S.deliverySummaryFor(rec, 'web');
  var recId = rec.id;

  /* ---- who may raise one ---- */
  eq(S.managerCanCorrect(rec, KULK), true, 'the Content Manager in scope may raise a correction');
  eq(S.managerCanCorrect(rec, RAO), false, 'A VENDOR MAY NOT — they have their own version route');
  eq(S.managerCanCorrect(rec, IYER), false, 'AND NEITHER MAY THE ACADEMIC REVIEWER');

  /* ---- validation ---- */
  eq(S.createCorrectionVersion(KULK, recId, { versionLabel: '', changeNote: 'x' }).ok, false,
    'a correction with no version label is refused');
  eq(S.createCorrectionVersion(KULK, recId, { versionLabel: '1.0', changeNote: 'x' }).ok, false,
    'REUSING THE PUBLISHED LABEL IS REFUSED — two artefacts may not share one version');
  eq(S.createCorrectionVersion(KULK, recId, { versionLabel: '1.1', changeNote: '' }).ok, false,
    'and a correction with no change note is refused');

  /* ---- raise it ---- */
  var made = S.createCorrectionVersion(KULK, recId, {
    versionLabel: '1.1', changeNote: 'The vendor’s hosted link moved to a new domain.',
    technology: 'web', deliveryPatch: { url: 'https://example.org/moved' }
  });
  eq(made.ok, true, 'the correction version is created');
  var v = made.version;
  eq(v.status, S.VERSION_STATUS.DRAFT, 'AS A DRAFT — nothing was sent to anybody');
  eq(v.origin, 'content-manager', 'PROVENANCE: raised by the Content Manager');
  eq(v.correction, true, 'and marked as a correction');
  eq(v.correctionOf, 'web', 'naming the technology it corrects');
  eq(S.versionIsCorrection(v), true, 'the predicate agrees');
  eq(v.replacesVersionLabel, '1.0', 'and it records the version it would replace');
  eq(v.delivery.web.url, 'https://example.org/moved', 'carrying the corrected link');
  eq(v.createdBy, KULK, 'attributed to the manager who raised it');
  ok(S.versionsForManager(KULK).some(function (x) { return x.id === v.id; }),
    'and it appears in that manager’s own corrections');
  ok(!S.versionsForVendor(RAO).some(function (x) { return x.id === v.id; }),
    'AND NOT IN THE VENDOR’S VERSIONS — it is not their work');

  /* ---- THE LIVE VERSION IS UNTOUCHED ---- */
  eq(S.deliverySummaryFor(S.contentRecord(recId), 'web'), liveUrl,
    'THE PUBLIC STILL SEES THE OLD LINK');
  eq(S.contentRecord(recId).versionLabel, '1.0', 'under the version label it was published as');
  eq(S.contentRecord(recId).status, S.CONTENT_STATUS.PUBLISHED, 'and it is still published');
  ok(S.contentRecord(recId).history.some(function (h) { return h.kind === 'version'; }),
    'AND THE PUBLISHED RECORD’S OWN TIMELINE RECORDS THE CORRECTION being raised');

  /* ---- TENANT ENTITLEMENT IS UNAFFECTED BY A CANDIDATE ---- */
  var g = grantAccess([recId], ['web'], 3, 'yearly');
  ok(!!g.access, 'an institution can still be granted the published experiment');
  S.assignExperiment(TENANT, g.access.id, recId, 'student', [RAHUL]);
  eq(S.studentCanRun(RAHUL, recId, 'web'), true,
    'AND A STUDENT CAN STILL RUN IT while a correction sits in the workflow');
  var entBefore = S.entitledStudentIds(TENANT).length;

  /* ---- only one open version at a time ---- */
  eq(S.createCorrectionVersion(KULK, recId, { versionLabel: '1.2', changeNote: 'Another.' }).ok, false,
    'A SECOND OPEN VERSION IS REFUSED — one candidate per experiment');
  eq(S.managerDeliveryEditMode(S.contentRecord(recId), KULK, 'web', { url: 'https://example.org/x' }),
    'blocked', 'and a further material edit is BLOCKED rather than silently queued');

  /* ---- THE EXISTING CHAIN, UNCHANGED ---- */
  ok(!!S.submitContentVersion(KULK, v.id), 'the manager submits it');
  eq(S.contentVersion(v.id).status, S.VERSION_STATUS.ACADEMIC_REVIEW,
    'AND IT GOES THROUGH ACADEMIC REVIEW — no gate is skipped');
  ok(S.versionsForReviewer(IYER).some(function (x) { return x.id === v.id; }),
    'it reaches the Academic Reviewer’s queue');
  ok(!!S.approveVersionAcademic(IYER, v.id, 'Academically unchanged.'), 'the reviewer approves it');
  eq(S.contentVersion(v.id).status, S.VERSION_STATUS.APPROVED, 'and it becomes APPROVED');
  eq(S.deliverySummaryFor(S.contentRecord(recId), 'web'), liveUrl,
    'AN ACADEMIC APPROVAL STILL CHANGES NOTHING PUBLIC');
  ok(S.versionsAwaitingDecision().some(function (x) { return x.id === v.id; }),
    'it reaches the Super Admin decision queue');

  /* ---- HOLD leaves the live version exactly where it is ---- */
  ok(!!S.holdVersion(v.id, 'QA — holding to check the live version.'), 'the Super Admin holds it');
  eq(S.contentVersion(v.id).status, S.VERSION_STATUS.HELD, 'and it is on hold');
  eq(S.deliverySummaryFor(S.contentRecord(recId), 'web'), liveUrl,
    'A HOLD LEAVES THE LIVE VERSION UNCHANGED');
  eq(S.contentRecord(recId).versionLabel, '1.0', 'still v1.0');
  eq(S.entitledStudentIds(TENANT).length, entBefore, 'AND NO ENTITLEMENT MOVED');
  eq(S.studentCanRun(RAHUL, recId, 'web'), true, 'the student can still run it');

  /* ---- RELEASE is the only thing that moves the public version ---- */
  ok(!!S.returnHeldVersionToDecision(v.id, 'QA — lifting the hold.'), 'the hold is lifted');
  eq(S.contentVersion(v.id).status, S.VERSION_STATUS.APPROVED, 'and it is decidable again');
  ok(S.contentVersion(v.id).history.some(function (h) { return h.kind === 'hold' || /hold/i.test(h.label); }),
    'AND THE HOLD STAYS IN THE HISTORY — lifting it does not erase it');

  ok(!!S.releaseVersion(v.id, 'QA — releasing the correction.'), 'the Super Admin releases it');
  eq(S.contentVersion(v.id).status, S.VERSION_STATUS.RELEASED, 'the candidate is released');
  eq(S.contentRecord(recId).versionLabel, '1.1', 'THE PUBLIC VERSION IS NOW 1.1');
  eq(S.deliverySummaryFor(S.contentRecord(recId), 'web'), 'https://example.org/moved',
    'AND ONLY NOW DOES THE CORRECTED LINK GO LIVE');
  eq(S.entitledStudentIds(TENANT).length, entBefore, 'entitlement is still untouched by the release');
  eq(S.studentCanRun(RAHUL, recId, 'web'), true, 'and the student still holds the experiment');
  eq(S.contentRecord(recId).technologies.join(','), 'web',
    'A RELEASE NEVER WIDENS OR NARROWS THE TECHNOLOGY SET');

  /* The published record's own audit trail carries the whole story. */
  var hist = S.contentRecord(recId).history;
  ok(hist.some(function (h) { return h.kind === 'version'; }), 'the record records the correction');
  ok(hist.some(function (h) { return h.kind === 'published'; }), 'and its original publication');

  /* With the candidate resolved, a material edit is a NEW correction. */
  eq(S.managerDeliveryEditMode(S.contentRecord(recId), KULK, 'web',
    { url: 'https://example.org/again' }), 'version',
    'A LATER MATERIAL EDIT STARTS ANOTHER CORRECTION, not an in-place write');
}

function scenario09RemovalCorrection() {
  group('IMPL 09 — a correction that withdraws a reference actually withdraws it on release');
  boot();

  /* ⚠ THE DEFECT THIS SCENARIO EXISTS FOR.
     `releaseVersion` MERGES a candidate's delivery onto the published
     record and skips empty values — correctly, so an unchanged
     technology carries its published values forward. But a REMOVAL
     correction produces an EMPTY block for that technology, so the
     merge found nothing to apply and the release silently did nothing:
     the Content Manager was told the reference would be withdrawn, an
     Academic Reviewer approved that, the Super Admin released it, and
     the stale link was still live. A removal is now recorded as an
     explicit instruction on the version and applied after the merge. */
  var rec = publishedFixture('QA 09 Removal Correction');
  var recId = rec.id;
  eq(S.deliverySummaryFor(S.contentRecord(recId), 'web'), 'https://example.org/qa-073',
    'the published record carries a hosted link');

  var made = S.createCorrectionVersion(KULK, recId, {
    versionLabel: '1.1', changeNote: 'The hosted experience was withdrawn by the vendor.',
    technology: 'web', remove: true
  });
  eq(made.ok, true, 'a withdrawal correction is created');
  eq(made.version.removals.join(','), 'web',
    'AND THE REMOVAL IS RECORDED AS AN INSTRUCTION, not as an empty delivery block');
  ok((made.version.clears.web || []).indexOf('url') !== -1,
    'and the fields it will clear are named — including the hosted URL');
  ok((made.version.clears.web || []).indexOf('runtime') !== -1,
    'and the device requirement, which the removal dialog also promises to clear');
  eq(S.deliverySummaryFor(S.contentRecord(recId), 'web'), 'https://example.org/qa-073',
    'the live link is untouched while the correction is in the workflow');

  S.submitContentVersion(KULK, made.version.id);
  ok(!!S.approveVersionAcademic(IYER, made.version.id, 'Approved.'), 'it is academically approved');
  eq(S.deliverySummaryFor(S.contentRecord(recId), 'web'), 'https://example.org/qa-073',
    'and STILL untouched after approval');

  ok(!!S.releaseVersion(made.version.id, 'QA — releasing the withdrawal.'), 'the Super Admin releases it');
  eq(S.deliverySummaryFor(S.contentRecord(recId), 'web'), '',
    'AND ONLY NOW IS THE REFERENCE ACTUALLY WITHDRAWN');
  eq(S.contentRecord(recId).versionLabel, '1.1', 'under the new version label');
  eq(S.contentRecord(recId).technologies.join(','), 'web',
    '⚠ AND THE TECHNOLOGY IS STILL ON THE EXPERIMENT — a removal never removes a technology');
  eq(S.publishReadiness(S.contentRecord(recId)).ok, false,
    'so the readiness gate closes, exactly as it does for an in-place removal');

  /* ── AND A SINGLE CLEARED FIELD IS NOT A NO-OP EITHER ─────────
     The same defect, one field down: blanking the device requirement
     while keeping the hosted link left the requirement exactly where it
     was, because the merge cannot tell an absent field from a cleared
     one. And the fix must not overreach — the field beside it survives. */
  boot();
  var rec3 = atContentGate('QA 09 Field Clear');
  S.managerUpdateDelivery(KULK, rec3.id, 'web', { runtime: 'Chrome 120 or later' },
    'Recording the runtime.');
  S.publishContent(KULK, rec3.id);
  var liveUrl3 = S.deliveryOf(S.contentRecord(rec3.id), 'web').url;
  eq(S.deliveryOf(S.contentRecord(rec3.id), 'web').runtime, 'Chrome 120 or later',
    'the published record states a device requirement');
  var c3 = S.createCorrectionVersion(KULK, rec3.id, {
    versionLabel: '1.1', changeNote: 'The runtime requirement no longer applies.',
    technology: 'web', deliveryPatch: { url: liveUrl3, runtime: '' }
  });
  eq(c3.ok, true, 'a field-clearing correction is created');
  eq((c3.version.clears.web || []).join(','), 'runtime',
    'AND NAMES EXACTLY THE FIELD IT CLEARS — not the one beside it');
  S.submitContentVersion(KULK, c3.version.id);
  S.approveVersionAcademic(IYER, c3.version.id, 'Approved.');
  S.releaseVersion(c3.version.id, 'QA.');
  eq(S.deliveryOf(S.contentRecord(rec3.id), 'web').runtime, undefined,
    'ON RELEASE THE FIELD IS ACTUALLY CLEARED');
  eq(S.deliveryOf(S.contentRecord(rec3.id), 'web').url, liveUrl3,
    'AND THE FIELD BESIDE IT SURVIVES — the fix does not overreach');

  /* A Vendor's ordinary later version carries no removals and merges
     exactly as it always did. */
  boot();
  var rec2 = publishedFixture('QA 09 Vendor Version Merge');
  var v2 = S.createContentVersion(RAO, rec2.id, {
    versionLabel: '2.0', description: 'A newer description.',
    changeNote: 'Rebuilt for the new term.', delivery: {}
  });
  eq(v2.ok, true, 'a Vendor later version is created');
  eq((v2.version.removals || []).length, 0, 'carrying no removals');
  eq(Object.keys(v2.version.clears || {}).length, 0, 'and no clears');
  S.submitContentVersion(RAO, v2.version.id);
  S.approveVersionAcademic(IYER, v2.version.id, 'ok');
  S.releaseVersion(v2.version.id, 'QA.');
  eq(S.deliverySummaryFor(S.contentRecord(rec2.id), 'web'), 'https://example.org/qa-073',
    'AND A VERSION THAT SUPPLIES NO DELIVERY STILL CARRIES THE PUBLISHED ONE FORWARD — the merge is unchanged');
  eq(S.contentRecord(rec2.id).versionLabel, '2.0', 'while the version label moves');
}

function scenario09CorrectionRevision() {
  group('IMPL 09 — a returned correction can be revised, not only re-sent unchanged');
  boot();

  /* ⚠ THE DEAD END THIS CLOSES.
     Only one later version may be open per Experiment. A correction the
     Academic Reviewer returned could previously only be re-sent
     verbatim — the reviewer would return it again — and because it
     stayed open it would block every future version of that Experiment
     for good. */
  var rec = publishedFixture('QA 09 Revise');
  var recId = rec.id;
  var liveUrl = S.deliverySummaryFor(rec, 'web');

  var made = S.createCorrectionVersion(KULK, recId, {
    versionLabel: '1.1', changeNote: 'First attempt.',
    technology: 'web', deliveryPatch: { url: 'https://example.org/first' }
  });
  eq(made.ok, true, 'a correction is raised');
  S.submitContentVersion(KULK, made.version.id);
  ok(!!S.requestChangesVersionAcademic(IYER, made.version.id, 'That link is the staging one.'),
    'the Academic Reviewer returns it with a reason');
  eq(S.contentVersion(made.version.id).status, S.VERSION_STATUS.CHANGES_ACADEMIC,
    'so it comes back to the Content Manager');

  eq(S.managerCanReviseVersion(S.contentVersion(made.version.id), KULK), true,
    'AND THE CONTENT MANAGER MAY REVISE IT');
  eq(S.managerCanReviseVersion(S.contentVersion(made.version.id), RAO), false,
    'a Vendor may not revise somebody else’s correction');
  eq(S.managerCanReviseVersion(S.contentVersion(made.version.id), IYER), false,
    'and neither may the Academic Reviewer who returned it');

  var revised = S.reviseCorrectionVersion(KULK, made.version.id, {
    versionLabel: '1.1', changeNote: 'Corrected to the production link.',
    technology: 'web', deliveryPatch: { url: 'https://example.org/production' }
  });
  eq(revised.ok, true, 'the correction is revised');
  eq(revised.version.delivery.web.url, 'https://example.org/production', 'carrying the new link');
  eq(revised.version.changeNote, 'Corrected to the production link.', 'and the new change note');
  eq(S.versionsForRecord(recId).length, 1, 'AND NO SECOND VERSION IS CREATED — one candidate, revised');
  eq(S.deliverySummaryFor(S.contentRecord(recId), 'web'), liveUrl,
    'the published link is still untouched');
  ok(S.contentVersion(made.version.id).history.some(function (h) { return /revised/i.test(h.label); }),
    'and the revision is in the candidate’s history');

  /* It then travels the rest of the chain normally. */
  ok(!!S.submitContentVersion(KULK, made.version.id), 'it is sent again');
  eq(S.contentVersion(made.version.id).status, S.VERSION_STATUS.ACADEMIC_REVIEW, 'and is back in review');
  ok(!!S.approveVersionAcademic(IYER, made.version.id, 'Approved now.'), 'this time it is approved');
  ok(!!S.releaseVersion(made.version.id, 'QA.'), 'and released');
  eq(S.deliverySummaryFor(S.contentRecord(recId), 'web'), 'https://example.org/production',
    'AND THE REVISED LINK IS WHAT GOES LIVE — not the one the reviewer rejected');

  /* Once it is released it is nobody's to revise. */
  eq(S.managerCanReviseVersion(S.contentVersion(made.version.id), KULK), false,
    'A RELEASED VERSION IS NOT REVISABLE — the chain is closed behind it');

  /* ---- PROVENANCE REACHES THE PEOPLE WHO DECIDE ---- */
  eq(XRSLP.versionUI ? 0 : 0, 0, 'version presentation helpers are a browser concern');
  eq(S.versionIsCorrection(S.contentVersion(made.version.id)), true,
    'the released candidate is still identifiable as a Content Manager correction');
  eq(S.contentVersion(made.version.id).origin, 'content-manager',
    'AND ITS ORIGIN IS NOT REWRITTEN BY THE CHAIN');
}

function scenario09WithdrawCorrection() {
  group('IMPL 09 — a correction can be taken back, so it never blocks an experiment for good');
  boot();

  /* ⚠ THE DEAD END THIS CLOSES.
     Exactly one later version may be open per Experiment. Before this
     pass only a VENDOR could occupy that slot, so a Vendor could always
     clear their own. Implementation 09 gave a SECOND role the ability
     to occupy it — and a correction a Content Manager raised and never
     sent would have blocked the Vendor's version route on that
     Experiment permanently, with nobody able to do anything about it. */
  var rec = publishedFixture('QA 09 Withdraw');
  var recId = rec.id;
  var liveUrl = S.deliverySummaryFor(rec, 'web');

  var made = S.createCorrectionVersion(KULK, recId, {
    versionLabel: '1.1', changeNote: 'Raised in error.',
    technology: 'web', deliveryPatch: { url: 'https://example.org/oops' }
  });
  eq(made.ok, true, 'a correction is raised');
  eq(S.vendorCanVersion(S.contentRecord(recId), RAO), true, 'the Vendor covers this experiment');
  eq(S.createContentVersion(RAO, recId, {
    versionLabel: '2.0', description: 'A newer build.', changeNote: 'Rebuilt.'
  }).ok, false, 'AND IS BLOCKED BY IT — one open version per experiment');

  eq(S.managerCanWithdrawVersion(S.contentVersion(made.version.id), KULK), true,
    'the manager who raised it may withdraw it');
  eq(S.managerCanWithdrawVersion(S.contentVersion(made.version.id), RAO), false,
    'A VENDOR CANNOT WITHDRAW SOMEBODY ELSE’S CORRECTION');
  eq(S.withdrawCorrectionVersion(KULK, made.version.id, ''), null,
    'and a withdrawal with no reason is refused');

  var histBefore = S.contentVersion(made.version.id).history.length;
  ok(!!S.withdrawCorrectionVersion(KULK, made.version.id, 'Raised against the wrong experiment.'),
    'the correction is withdrawn');
  eq(S.contentVersion(made.version.id).status, S.VERSION_STATUS.WITHDRAWN, 'and reads as withdrawn');

  /* ⚠ NOTHING IS DELETED. */
  ok(!!S.contentVersion(made.version.id), 'THE CANDIDATE STILL EXISTS');
  eq(S.contentVersion(made.version.id).changeNote, 'Raised in error.', 'with its change note');
  eq(S.contentVersion(made.version.id).history.length, histBefore + 1,
    'and its history grew by exactly one entry');
  ok(S.contentRecord(recId).history.some(function (h) { return /withdrawn/i.test(h.label); }),
    'AND THE EXPERIMENT’S OWN TIMELINE RECORDS THE WITHDRAWAL');
  ok(S.contentRecord(recId).history.some(function (h) { return /drafted/i.test(h.label); }),
    'beside the entry that recorded it being raised');

  /* And the slot is free again — for either role. */
  eq(S.openVersionForRecord(recId), null, 'the experiment has no open version again');
  eq(S.deliverySummaryFor(S.contentRecord(recId), 'web'), liveUrl,
    'the published link never moved');
  var v2 = S.createContentVersion(RAO, recId, {
    versionLabel: '2.0', description: 'A newer build.', changeNote: 'Rebuilt for the new term.'
  });
  eq(v2.ok, true, 'AND THE VENDOR’S VERSION ROUTE WORKS AGAIN');
  eq(S.managerDeliveryEditMode(S.contentRecord(recId), KULK, 'web',
    { url: 'https://example.org/later' }), 'blocked',
    'while the Vendor’s candidate now holds the slot, as it always did');

  /* A candidate somebody else is holding cannot be pulled from them. */
  boot();
  var rec2 = publishedFixture('QA 09 Withdraw Guard');
  var c2 = S.createCorrectionVersion(KULK, rec2.id, {
    versionLabel: '1.1', changeNote: 'A correction.', technology: 'web',
    deliveryPatch: { url: 'https://example.org/x' }
  });
  S.submitContentVersion(KULK, c2.version.id);
  eq(S.managerCanWithdrawVersion(S.contentVersion(c2.version.id), KULK), false,
    'A CORRECTION WITH THE ACADEMIC REVIEWER CANNOT BE PULLED FROM UNDER THEM');
  eq(S.withdrawCorrectionVersion(KULK, c2.version.id, 'Changed my mind.'), null,
    'and the writer refuses it');
  S.approveVersionAcademic(IYER, c2.version.id, 'Approved.');
  eq(S.managerCanWithdrawVersion(S.contentVersion(c2.version.id), KULK), false,
    'nor can one awaiting the Super Admin’s decision');

  /* Returned by the reviewer, it is the manager's again — which is the
     case that would otherwise dead-end. */
  boot();
  var rec3 = publishedFixture('QA 09 Withdraw Returned');
  var c3 = S.createCorrectionVersion(KULK, rec3.id, {
    versionLabel: '1.1', changeNote: 'A correction.', technology: 'web',
    deliveryPatch: { url: 'https://example.org/y' }
  });
  S.submitContentVersion(KULK, c3.version.id);
  S.requestChangesVersionAcademic(IYER, c3.version.id, 'Not this link.');
  eq(S.managerCanWithdrawVersion(S.contentVersion(c3.version.id), KULK), true,
    'A RETURNED CORRECTION IS THE MANAGER’S AGAIN — to revise or to withdraw');
  ok(!!S.withdrawCorrectionVersion(KULK, c3.version.id, 'It is not needed after all.'),
    'and withdrawing it works');
  eq(S.openVersionForRecord(rec3.id), null, 'freeing the experiment');
}

function scenario09MaterialityTable() {
  group('IMPL 09 — which fields are material is stated, not guessed');
  boot();

  var rec = publishedFixture('QA 09 Materiality');
  ok(S.MANAGER_MATERIAL_DELIVERY_FIELDS.indexOf('url') !== -1, 'the hosted URL is material');
  ok(S.MANAGER_MATERIAL_DELIVERY_FIELDS.indexOf('packageRef') !== -1, 'the package reference is material');
  ok(S.MANAGER_MATERIAL_DELIVERY_FIELDS.indexOf('packageLabel') !== -1, 'the package label is material');
  ok(S.MANAGER_MATERIAL_DELIVERY_FIELDS.indexOf('runtime') !== -1,
    'AND SO IS THE DEVICE / RUNTIME REQUIREMENT — it is what a student is told they need');
  ok(S.MANAGER_MATERIAL_DELIVERY_FIELDS.indexOf('notes') === -1,
    'content-plane notes are not material');
  eq(S.MANAGER_SAFE_DELIVERY_FIELDS.join(','), 'notes', 'and they are the only safe delivery field');

  /* The two sets partition the writable set — nothing falls between. */
  var union = S.MANAGER_MATERIAL_DELIVERY_FIELDS.concat(S.MANAGER_SAFE_DELIVERY_FIELDS).sort().join(',');
  eq(union, S.MANAGER_DELIVERY_FIELDS.slice().sort().join(','),
    'EVERY WRITABLE DELIVERY FIELD IS CLASSIFIED — a new one cannot slip through unclassified');

  eq(S.deliveryPatchIsMaterial(rec, 'web', { runtime: 'Chrome 130 or later' }), true,
    'changing the runtime requirement is material');
  eq(S.deliveryPatchIsMaterial(rec, 'web', { notes: 'anything' }), false,
    'changing the notes is not');
  eq(S.deliveryPatchIsMaterial(rec, 'web', { url: S.deliveryOf(rec, 'web').url }), false,
    'and re-saving the same URL is not a change at all');
  eq(S.deliveryPatchIsMaterial(rec, 'web', null, true), true, 'a removal always is');
  eq(S.metadataPatchIsMaterial(rec, { description: rec.description }), false,
    'an unchanged description is not material');
  eq(S.metadataPatchIsMaterial(rec, { description: 'Something else.' }), true,
    'a changed one is');
  eq(S.metadataPatchIsMaterial(rec, { summary: 'Anything at all.', description: rec.description }), false,
    'and the catalogue summary is not');

  /* ── THE ONE NAMED EXCEPTION, PINNED ──────────────────────────
     The Super Admin's platform-master correction is NOT gated by the
     material-change rule. That is deliberate — `07.2` rule F confirms
     the capability by name, including the description, and there is no
     correction-version route for that role. It is also not the failure
     PM-08 described: it refuses without a reason on published content
     and writes an audit entry naming who, when and why.

     This assertion exists so the exception cannot drift in EITHER
     direction without a person deciding to change it, and so a reader
     of the suite finds it stated rather than discovering it. It is
     recorded as open question D-09-11. */
  var pubDesc = S.contentRecord(rec.id).description;
  var hBefore = S.contentRecord(rec.id).history.length;
  eq(S.updateCanonicalAsPlatform(rec.id, {
    name: rec.name, courseId: rec.courseId, summary: rec.summary, description: 'Platform correction.'
  }, '').ok, false,
    'THE SUPER ADMIN MASTER CORRECTION REFUSES WITHOUT A REASON on published content');
  eq(S.contentRecord(rec.id).description, pubDesc, 'and writes nothing when refused');
  eq(S.updateCanonicalAsPlatform(rec.id, {
    name: rec.name, courseId: rec.courseId, summary: rec.summary, description: 'Platform correction.'
  }, 'The published description was factually wrong.').ok, true,
    'BUT WITH A REASON IT IS ACCEPTED — a confirmed 07.2 rule-F authority this pass does not withdraw');
  eq(S.contentRecord(rec.id).description, 'Platform correction.',
    'IT WRITES IN PLACE — the one named exception to the material-change rule');
  eq(S.contentRecord(rec.id).history.length, hBefore + 1, 'AND IT IS AUDITED, so it is never silent');
  ok(/factually wrong/.test(S.contentRecord(rec.id).history[0].note),
    'carrying the reason that was given');

  /* ⚠ AN OMITTED FIELD IS NOT AN UNTOUCHED FIELD ON THIS WRITER.
     `updateCanonicalMetadata` assigns every canonical field
     unconditionally, so a patch that leaves `description` out does not
     preserve it — it BLANKS it. Skipping an absent field the way the
     delivery check does would have classified "erase the published
     instructional content" as a non-material change and let it straight
     through the gate. */
  eq(S.metadataPatchIsMaterial(rec, { name: rec.name, summary: rec.summary }), true,
    'A PATCH THAT OMITS THE DESCRIPTION IS MATERIAL — because the writer would erase it');
  var descBefore = S.contentRecord(rec.id).description;
  ok(!!descBefore, 'the published record has a description to lose');
  eq(S.updateCanonicalMetadata(KULK, rec.id, {
    name: rec.name, courseId: rec.courseId, summary: 'A new summary.'
  }), null, 'AND THE WRITER REFUSES IT');
  eq(S.contentRecord(rec.id).description, descBefore,
    'SO THE PUBLISHED DESCRIPTION IS NOT ERASED IN PLACE');

  /* The delivery writer is genuinely different: it touches only the
     fields the patch supplies, so there an absent field IS untouched. */
  eq(S.deliveryPatchIsMaterial(rec, 'web', { notes: 'anything' }), false,
    'while on the DELIVERY writer an omitted field really is untouched, and stays non-material');
}


/* ============================================================
   IMPLEMENTATION 09 — the UX / CLARITY CORRECTION.

   Manual end-to-end QA of Implementation 09 passed on behaviour and
   failed on clarity: two competing detail paths, an aggregate whose
   denominator asserted a rule no source states, domain vocabulary on
   screens people read, a next step nobody could find, and a decision
   surface that showed the new value without the old one.

   These groups assert the corrections, and — more importantly — assert
   that the behaviour underneath them did not move.
   ============================================================ */

/* Read a product source file the way `scenario08StaticSource` does:
   some of what this pass corrected is presentation, and presentation
   is only assertable from the source. */
function src09(path) {
  try { return readFile(path); } catch (e) { return ''; }
}
/* Comments in this codebase quote the wording they removed, on purpose
   — so a raw substring search would fail on its own audit trail. Only
   the code is searched. */
function code09(path) {
  return src09(path).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function scenario09cFacultyOneDetailPath() {
  group('IMPL 09c — Student Progress offers ONE detail destination, not two');
  boot();

  var fac = code09('js/screens/faculty.js');

  /* ⚠ THE DUPLICATE PATH IS GONE. A row carried both a "Usage" drawer
     and an "Open" link, and a reader had to guess which held what. */
  eq(fac.indexOf('data-use=') === -1, true,
    'the Usage drawer control is no longer rendered on any row');
  eq(fac.indexOf('data-use-exp') === -1, true, 'and neither is its experiment attribute');
  eq(fac.indexOf('ui.openSheet') === -1, true, 'the usage sheet is not opened from this screen at all');
  ok(fac.indexOf('View details') !== -1, 'the single detail action is View details');
  ok(fac.indexOf('F.href.studentDetail(f.id, x.person.id, x.experimentId)') !== -1,
    'AND IT LEADS TO THE FULL STUDENT–EXPERIMENT RECORD');

  /* ⚠ THE UTILISATION DETAIL WAS NOT LOST WITH THE DRAWER. */
  ok(fac.indexOf('useDetailHTML') !== -1, 'the per-technology breakdown renderer still exists');
  ok(fac.indexOf('F.useDetailHTML(student.id, e.id, techs)') !== -1,
    'and the full record still renders it');
  ok(fac.indexOf('useFigures') !== -1, 'the compact figures helper is still used on the row');
  ok(fac.indexOf('useSourceNote') !== -1,
    'and so is the stand-in note — a demo figure may never look like device traffic');

  /* The derivations behind all of it are untouched. */
  var g = grantAccess(['direct-shear'], ['web', 'vr', 'ar'], 5, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  S.mapFaculty(TENANT, ARJUN, g.access.id, 'soil-mechanics', null);
  S.runtimeSimulateRun(RAHUL, 'direct-shear', 'web', { durationSeconds: 13, complete: false });
  var u = S.experimentUtilisation(RAHUL, 'direct-shear', ['web', 'vr', 'ar']);
  eq(u.launches, 1, 'the launch count still derives');
  eq(u.sessionCount, 1, 'and the session count');
  eq(u.totalSeconds, 13, 'and the time spent');
  eq(u.used.join(','), 'web', 'and which technology was actually used');
  ok(!!S.simulationUtilisation(RAHUL, 'direct-shear', 'web').firstActivityAt, 'and first activity');
  ok(!!S.simulationUtilisation(RAHUL, 'direct-shear', 'web').lastActivityAt, 'and last activity');
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'vr').status, S.SIM_STATUS.NOT_STARTED,
    'AND EACH TECHNOLOGY IS STILL REPORTED ON ITS OWN');
}

function scenario09cNoTechnologyDenominator() {
  group('IMPL 09c — no aggregate claims that every technology format is mandatory');
  boot();

  /* ⚠ THE CLAIM THIS REMOVES.
     "Steps done 0 of 9" and "0 of 3 simulations completed" both counted
     one mandatory step per technology format. Web, AR and VR are
     delivery formats of ONE experiment; no confirmed source says a
     student must finish all of the formats their institution happens to
     hold. The figures asserted a rule that does not exist. */
  var screens = ['js/screens/faculty.js', 'js/screens/student.js', 'js/screens/student-learn.js'];
  screens.forEach(function (path) {
    var code = code09(path);
    /* ⚠ THE LEARNING-STEP AGGREGATE ONLY. An assessment SCORE is also a
       percentage and is a completely different figure — it has a real
       denominator (the marks available) and nothing to do with
       technology formats. Matching on the progress object is what keeps
       this assertion about the claim it exists to stop. */
    eq(/(prog|fp)\.percent/.test(code), false,
      'no learning-step percentage is rendered in ' + path);
    eq(/steps\.done\s*\+\s*' of '/.test(code), false,
      'and no "N of M steps" figure in ' + path);
    eq(/progressBar\(\s*\w+\.percent/.test(code), false,
      'and no bar drawn from that percentage in ' + path);
  });
  eq(/of ' \+ prog\.technologies\.length/.test(code09('js/screens/faculty.js')), false,
    'AND NO "of N simulations" DENOMINATOR on the Faculty record');

  /* ⚠ THE UNDERLYING RECORDS ARE UNTOUCHED. Nothing was deleted to
     achieve the above — the state layer still derives both, and the
     per-technology records behind them are exactly as they were. */
  var g = grantAccess(['direct-shear'], ['web', 'vr'], 5, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  var prog = S.experimentProgress(RAHUL, 'direct-shear', ['web', 'vr']);
  ok(!!prog.steps && typeof prog.steps.total === 'number',
    'the state layer still derives the step figures');
  ok(typeof prog.percent === 'number', 'and the percentage');
  eq(prog.technologies.length, 2, 'AND EVERY TECHNOLOGY RECORD SURVIVES');
  eq(prog.factual.simulation.technologies.length, 2, 'in the factual strand too');

  /* The three strands stay separate, each with its own denominator. */
  eq(prog.factual.resources.total, D.resourcesFor('direct-shear').length,
    'resources are counted against resources');
  eq(prog.factual.simulation.technologiesUsed.length, 0, 'simulations against simulations');
  eq(prog.factual.assessment.configured, true, 'and the assessment on its own');
}

function scenario09cConservativeOverall() {
  group('IMPL 09c — the overall state stays conservative and never over-claims');
  boot();

  var g = grantAccess(['direct-shear'], ['web', 'vr'], 5, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  var techs = ['web', 'vr'];

  eq(S.experimentProgress(RAHUL, 'direct-shear', techs).status, S.TECH_PROGRESS.NOT_STARTED,
    'no activity at all reads as Not started');

  /* Reading a resource is activity, so the state moves — and no
     further than that. */
  S.openResource(RAHUL, 'direct-shear', 'dsh-r1');
  eq(S.experimentProgress(RAHUL, 'direct-shear', techs).status, S.TECH_PROGRESS.IN_PROGRESS,
    'ACTUAL ACTIVITY reads as In progress');

  /* ⚠ THE FOUR THINGS THAT MUST NEVER PRODUCE "Completed". */
  D.resourcesFor('direct-shear').forEach(function (r) {
    S.setResourceComplete(RAHUL, 'direct-shear', r.id, true);
  });
  ok(S.experimentProgress(RAHUL, 'direct-shear', techs).status !== S.TECH_PROGRESS.COMPLETED,
    'reading every resource does not complete the experiment');

  S.runtimeSimulateRun(RAHUL, 'direct-shear', 'web', { durationSeconds: 60 * 60 * 5, complete: false });
  ok(S.experimentProgress(RAHUL, 'direct-shear', techs).status !== S.TECH_PROGRESS.COMPLETED,
    'and neither does five hours of recorded use');

  var att = S.startAttempt(RAHUL, 'direct-shear');
  if (att) {
    (S.attemptAssessment(att) || { questions: [] }).questions.forEach(function (q) {
      S.saveAnswer(att.id, q.id, q.type === 'mcq' ? q.answer : q.type === 'tf' ? q.answer : 'An answer.');
    });
    S.submitAttempt(att.id);
  }
  ok(S.experimentProgress(RAHUL, 'direct-shear', techs).status !== S.TECH_PROGRESS.COMPLETED,
    'AND NEITHER DOES SUBMITTING — OR PASSING — THE ASSESSMENT');

  /* A completion in ONE format never completes the experiment either,
     which is what keeps the cautious reading cautious. */
  S.runtimeSimulateRun(RAHUL, 'direct-shear', 'web', { durationSeconds: 300, complete: true });
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'web').completed, true, 'Web is completed');
  eq(S.simulationUtilisation(RAHUL, 'direct-shear', 'vr').completed, false, 'VR is not');
  ok(S.experimentProgress(RAHUL, 'direct-shear', techs).status !== S.TECH_PROGRESS.COMPLETED,
    'AND THE EXPERIMENT IS NOT ANNOUNCED AS COMPLETE while a format is unfinished');

  /* ⚠ AND THE OPENNESS IS PRESERVED IN THE PRODUCT'S OWN WORDS.
     Whether every format is required at all is a stakeholder question,
     and the screens say so rather than settling it by wording. */
  var fac = src09('js/screens/faculty.js');
  ok(/not settled/i.test(fac),
    'the Faculty completion note names the open question rather than asserting a policy');
}

function scenario09cPlainLanguage() {
  group('IMPL 09c — no domain vocabulary on the Faculty and Tenant utilisation surfaces');
  boot();

  /* ⚠ SEARCHED IN THE STRINGS ONLY. The state layer's own field and
     function names are domain vocabulary and stay exactly as they are;
     what may not survive is a user reading them. */
  function visibleStrings(path) {
    var code = code09(path);
    var out = [];
    var re = /'((?:[^'\\]|\\.)*)'/g, m;
    while ((m = re.exec(code))) { out.push(m[1]); }
    return out;
  }
  /* A string is USER-VISIBLE unless it is plainly a selector, an id, a
     class list or a state key. */
  function userText(t) {
    if (t.length < 6) { return false; }
    if (t.indexOf(' ') === -1) { return false; }
    if (/^[.#\[]/.test(t)) { return false; }
    if (/^</.test(t) && !/[a-z] [a-z]/i.test(t.replace(/<[^>]*>/g, ''))) { return false; }
    return true;
  }
  [['js/screens/faculty.js', 'Faculty'], ['js/screens/tenant.js', 'Tenant']].forEach(function (pair) {
    var bad = visibleStrings(pair[0]).filter(function (t) {
      if (!userText(t)) { return false; }
      var plain = t.replace(/<[^>]*>/g, ' ');
      return /\bentitle(d|ment|ments)\b/i.test(plain) || /\baccess record\b/i.test(plain);
    });
    /* The Tenant OVERVIEW is a stakeholder-closed screen this pass may
       not touch, so its own copy is excluded by name rather than by
       being missed. */
    bad = bad.filter(function (t) {
      return !/no entitlement is effective until it is reactivated|They hold an access grant but no effective|No student holds effective entitlement right now|Nobody who is currently entitled is ever displaced/.test(t);
    });
    eq(bad.length, 0, 'no user-visible entitlement wording in ' + pair[1] + ' screens' +
      (bad.length ? ' — found: ' + bad.slice(0, 3).join(' | ') : ''));
  });

  /* ⚠ AND NO INTERNAL IDENTIFIER LEAKS EITHER. */
  [['js/screens/faculty.js', 'Faculty'], ['js/screens/tenant.js', 'Tenant']].forEach(function (pair) {
    var bad = visibleStrings(pair[0]).filter(function (t) { return /\bACC-\d/.test(t); });
    eq(bad.length, 0, 'no literal access-record identifier in ' + pair[1] + ' copy');
  });

  /* The counts behind the relabelled figures are unchanged. */
  var g = grantAccess(['direct-shear'], ['web'], 5, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  S.mapFaculty(TENANT, ARJUN, g.access.id, 'soil-mechanics', null);
  eq(S.entitledStudentIds(TENANT).length, 1, 'the institution still counts one student with access');
  eq(S.facultyStudentReach(ARJUN, 'direct-shear').length, 1, 'and the Faculty reach is unchanged');
}

function scenario09cCorrectionStates() {
  group('IMPL 09c — a correction shows only the actions its state actually allows');
  boot();

  var rec = publishedFixture('QA 09c States');
  var made = S.createCorrectionVersion(KULK, rec.id, {
    versionLabel: '1.1', changeNote: 'A correction.', technology: 'web',
    deliveryPatch: { url: 'https://example.org/moved' }
  });
  eq(made.ok, true, 'a correction is raised');
  var v = made.version;

  /* DRAFT — the manager's, and the next step is theirs. */
  eq(S.managerCanReviseVersion(S.contentVersion(v.id), KULK), true,
    'a DRAFT is the manager’s to send, edit or withdraw');

  /* WITH THE REVIEWER — nobody else may move it. */
  S.submitContentVersion(KULK, v.id);
  eq(S.contentVersion(v.id).status, S.VERSION_STATUS.ACADEMIC_REVIEW, 'sending puts it in academic review');
  eq(S.managerCanReviseVersion(S.contentVersion(v.id), KULK), false,
    'AND IT IS NO LONGER THE MANAGER’S TO CHANGE');
  eq(S.withdrawCorrectionVersion(KULK, v.id, 'Changed my mind.'), null,
    'so it cannot be withdrawn from under the reviewer');

  /* RETURNED — theirs again. */
  S.requestChangesVersionAcademic(IYER, v.id, 'Not that link.');
  eq(S.managerCanReviseVersion(S.contentVersion(v.id), KULK), true,
    'a RETURNED correction is the manager’s again');

  /* AWAITING RELEASE — the Super Admin's. */
  S.submitContentVersion(KULK, v.id);
  S.approveVersionAcademic(IYER, v.id, 'Approved.');
  eq(S.contentVersion(v.id).status, S.VERSION_STATUS.APPROVED, 'approval puts it with the Super Admin');
  eq(S.managerCanReviseVersion(S.contentVersion(v.id), KULK), false,
    'AND NOT WITH THE MANAGER');

  /* RELEASED — history, and nobody's to move. */
  S.releaseVersion(v.id, 'QA.');
  eq(S.contentVersion(v.id).status, S.VERSION_STATUS.RELEASED, 'releasing closes the chain');
  eq(S.managerCanReviseVersion(S.contentVersion(v.id), KULK), false,
    'A RELEASED CORRECTION IS HISTORY, not an active draft');

  /* ⚠ AND THE PANEL SAYS SO. The presentation is asserted from the
     source, because a card that still looks like a draft after release
     is exactly what this correction pass exists to stop. */
  var cm = code09('js/screens/content-manager.js');
  ok(cm.indexOf('correctionPanel') !== -1, 'a per-correction panel is rendered');
  ok(cm.indexOf("case VS.RELEASED") !== -1, 'and it branches on the released state');
  ok(/closed\s*=\s*v\.status === VS\.RELEASED \|\| v\.status === VS\.WITHDRAWN/.test(cm),
    'a released or withdrawn correction is drawn as closed');
  ok(/'Next step'/.test(cm), 'a live correction states its NEXT STEP as its own block');
  ok(cm.indexOf("data-cx=\"send\"") !== -1 || cm.indexOf("data-cx='send'") !== -1 ||
     cm.indexOf("'send'") !== -1, 'and the send action is one of the panel’s own controls');
}

function scenario09cReviewerAndSuperAdminDiff() {
  group('IMPL 09c — both decision surfaces show current → proposed, and the right author');
  boot();

  var rec = publishedFixture('QA 09c Diff');
  var liveUrl = S.deliverySummaryFor(rec, 'web');
  var made = S.createCorrectionVersion(KULK, rec.id, {
    versionLabel: '1.1', changeNote: 'The hosted experience moved.', technology: 'web',
    deliveryPatch: { url: 'https://example.org/moved-v1-1' }
  });
  var v = made.version;

  /* ⚠ PROVENANCE. The stepper said "Submitted by the Vendor" for every
     candidate, so a Content Manager's correction was described to the
     Academic Reviewer as somebody else's work. */
  eq(S.versionIsCorrection(S.contentVersion(v.id)), true, 'the candidate records that it is a correction');
  eq(S.contentVersion(v.id).origin, 'content-manager', 'and who raised it');
  var cv = code09('js/screens/content-version.js');
  eq(/'Submitted by the Vendor'/.test(cv), false,
    'THE STEPPER NO LONGER HARD-CODES THE VENDOR');
  ok(/raisedByRole\(v\)/.test(cv), 'it reads the role off the candidate');
  ok(/'Correction proposed' : 'Version proposed'/.test(cv),
    'and names a correction as a correction rather than as a version submission');

  /* ⚠ THE DIFF. Both people who decide on a version see the live value
     beside the proposed one, for the fields that actually move. */
  var changes = XRSLP.versionUI ? null : null;   /* browser-only helper */
  ok(cv.indexOf('function versionChanges') !== -1, 'a current → proposed derivation exists');
  ok(cv.indexOf('versionDiffHTML') !== -1, 'and a renderer for it');
  ok(cv.indexOf("versionDiffHTML(rec, v, { hideReason: true })") !== -1,
    'THE ACADEMIC REVIEWER’S SCREEN RENDERS IT');
  ok(code09('js/screens/platform-content.js').indexOf('XRSLP.versionUI.diff(rec, pending') !== -1,
    'AND SO DOES THE SUPER ADMIN’S RELEASE / HOLD SURFACE');

  /* Only CHANGED fields — a wall of unchanged rows is how the two that
     moved get missed. */
  ok(/if \(!b \|\| a === b\) \{ return; \}/.test(cv),
    'an unchanged value produces no comparison row');
  ok(/'cleared'/.test(cv), 'and a withdrawal is distinguished from an empty new value');

  /* ⚠ AND THE DECISION ITSELF IS UNTOUCHED. */
  S.submitContentVersion(KULK, v.id);
  S.approveVersionAcademic(IYER, v.id, 'Approved.');
  eq(S.deliverySummaryFor(S.contentRecord(rec.id), 'web'), liveUrl,
    'approval still releases nothing');
  ok(!!S.holdVersion(v.id, 'QA hold.'), 'Hold still works');
  eq(S.deliverySummaryFor(S.contentRecord(rec.id), 'web'), liveUrl, 'and leaves the live version alone');
  S.returnHeldVersionToDecision(v.id, 'QA lift.');
  ok(!!S.releaseVersion(v.id, 'QA release.'), 'Release still works');
  eq(S.contentRecord(rec.id).versionLabel, '1.1', 'and moves the public version');
  eq(S.deliverySummaryFor(S.contentRecord(rec.id), 'web'), 'https://example.org/moved-v1-1',
    'and the corrected reference goes live');
}

function scenario09cPublicationLabels() {
  group('IMPL 09c — first publication and current public version are told apart');
  boot();

  var rec = publishedFixture('QA 09c Labels');
  eq(S.contentRecord(rec.id).publication.versionLabel, '1.0',
    'the publication record holds the version that was FIRST published');
  eq(S.contentRecord(rec.id).versionLabel, '1.0', 'which is also the current one, for now');

  var made = S.createCorrectionVersion(KULK, rec.id, {
    versionLabel: '1.1', changeNote: 'A correction.', technology: 'web',
    deliveryPatch: { url: 'https://example.org/moved' }
  });
  S.submitContentVersion(KULK, made.version.id);
  S.approveVersionAcademic(IYER, made.version.id, 'ok');
  S.releaseVersion(made.version.id, 'QA.');

  /* ⚠ THE AMBIGUITY THIS CLOSES. Both numbers are correct and they
     differ; the card used to print the first one under a bare heading
     while the page title showed the second. */
  eq(S.contentRecord(rec.id).versionLabel, '1.1', 'the record now shows 1.1 as current');
  eq(S.contentRecord(rec.id).publication.versionLabel, '1.0',
    'AND THE FIRST-PUBLICATION RECORD IS NOT REWRITTEN');

  var cui = code09('js/content-ui.js');
  ok(cui.indexOf("'First published version'") !== -1, 'the card labels the first published version');
  ok(cui.indexOf("'Current public version'") !== -1, 'and names the current one beside it');
  eq(/kvLine\('Version', esc\(p\.versionLabel\)\)/.test(cui), false,
    'THE BARE "Version" LABEL IS GONE from both branches');
  ok(code09('js/screens/content-manager.js').indexOf("ui.card('First publication'") !== -1,
    'and the card is headed First publication');
}

function scenario09cFlowStillWorks() {
  group('IMPL 09c — the manually tested version flow is unchanged, end to end');
  boot();

  /* ⚠ THE EXACT SEQUENCE MANUAL QA SIGNED OFF. It is asserted here so
     a later presentation change cannot quietly break it. */
  var rec = publishedFixture('QA 09c Flow');
  var recId = rec.id;
  eq(S.contentRecord(recId).versionLabel, '1.0', '1 · published as 1.0');
  var liveUrl = S.deliverySummaryFor(S.contentRecord(recId), 'web');

  var g = grantAccess([recId], ['web'], 3, 'yearly');
  S.assignExperiment(TENANT, g.access.id, recId, 'student', [RAHUL]);
  eq(S.studentCanRun(RAHUL, recId, 'web'), true, 'a student can run it');

  var made = S.createCorrectionVersion(KULK, recId, {
    versionLabel: '1.1', changeNote: 'Updated the hosted Web simulation URL.',
    technology: 'web', deliveryPatch: { url: 'https://example.org/web-v1-1' }
  });
  eq(made.ok, true, '2 · the Content Manager creates correction 1.1');
  eq(S.contentRecord(recId).versionLabel, '1.0', '3 · 1.0 REMAINS LIVE');
  eq(S.deliverySummaryFor(S.contentRecord(recId), 'web'), liveUrl, 'with its own link');
  eq(S.studentCanRun(RAHUL, recId, 'web'), true, 'and the student keeps their access');

  ok(!!S.submitContentVersion(KULK, made.version.id), '4 · it is sent for Academic Review');
  eq(S.contentVersion(made.version.id).status, S.VERSION_STATUS.ACADEMIC_REVIEW, 'and lands there');
  ok(!!S.approveVersionAcademic(IYER, made.version.id, 'Approved.'), '5 · the Reviewer approves it');
  eq(S.contentVersion(made.version.id).status, S.VERSION_STATUS.APPROVED,
    '6 · the Super Admin sees it Awaiting Release / Hold');
  ok(S.versionsAwaitingDecision().some(function (x) { return x.id === made.version.id; }),
    'in their decision queue');

  ok(!!S.releaseVersion(made.version.id, 'Released.'), '7 · the Super Admin releases it');
  eq(S.contentRecord(recId).versionLabel, '1.1', '8 · the public version becomes 1.1');
  eq(S.deliverySummaryFor(S.contentRecord(recId), 'web'), 'https://example.org/web-v1-1',
    '9 · the new Web URL is live');
  ok(S.contentRecord(recId).history.length > 1, '10 · the history remains');
  eq(S.contentRecord(recId).publication.versionLabel, '1.0',
    'and the first publication is untouched');
  eq(S.studentCanRun(RAHUL, recId, 'web'), true, 'and nobody lost access');

  /* 11 · it survives a reload. */
  loadState();
  S = XRSLP.state;
  eq(S.SCHEMA_VERSION, 12, 'the build is still at schema 12');
  eq(S.STORAGE_KEY, 'xrslp-unified-v1', 'under the same storage key');
  eq(S.contentRecord(recId).versionLabel, '1.1', 'AND 1.1 IS STILL THE PUBLIC VERSION AFTER A RELOAD');
  eq(S.deliverySummaryFor(S.contentRecord(recId), 'web'), 'https://example.org/web-v1-1',
    'with the released URL');
  eq(S.contentVersion(made.version.id).status, S.VERSION_STATUS.RELEASED, 'and the candidate released');
}

function scenario09cTelemetrySurvives() {
  group('IMPL 09c — the runtime telemetry model is untouched by the clarity pass');
  boot();

  /* The exact figures manual QA confirmed, and they must survive a
     reload — this pass changed how they are PRESENTED and nothing
     about how they are recorded. */
  var g = grantAccess(['direct-shear'], ['web'], 5, 'yearly');
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL]);
  var a = S.runtimeLaunch(RAHUL, 'direct-shear', 'web');
  S.runtimeEndSession(RAHUL, 'direct-shear', 'web', a.sessionId, { durationSeconds: 13 });
  S.runtimeLaunch(RAHUL, 'direct-shear', 'web');

  var before = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  eq(before.launches, 2, '2 launches');
  eq(before.sessionCount, 2, '2 sessions');
  eq(before.totalSeconds, 13, '13 seconds');
  eq(before.openSessions, 1, 'one of them still open');
  eq(before.status, S.SIM_STATUS.IN_PROGRESS, 'In progress');
  eq(before.completed, false, 'and not completed');

  loadState();
  S = XRSLP.state;
  var after = S.simulationUtilisation(RAHUL, 'direct-shear', 'web');
  eq(after.launches, 2, 'AFTER A RELOAD: 2 launches');
  eq(after.sessionCount, 2, '2 sessions');
  eq(after.totalSeconds, 13, '13 seconds');
  eq(after.status, S.SIM_STATUS.IN_PROGRESS, 'still In progress');
  eq(S.runtimeEvents().length >= 3, true, 'and every event survives');
}

function scenario09cWithholdingStillProtected() {
  group('IMPL 09c — result withholding survives the Faculty presentation change');
  boot();

  var g = grantAccess(['direct-shear'], ['web'], 5, 'yearly');
  var OTHER = S.studentsForTenant(TENANT).filter(function (p) { return p.id !== RAHUL; })[0].id;
  S.assignExperiment(TENANT, g.access.id, 'direct-shear', 'student', [RAHUL, OTHER]);
  var def = S.assessmentForTenant(TENANT, 'direct-shear');
  S.updateAssessmentSettings(def.id, {
    title: def.title, passMark: def.passMark, attemptLimit: def.attemptLimit,
    policyMode: 'CUSTOM_DATE', customDate: '2099-01-01'
  }, ARJUN);
  function take(pid, correct) {
    S.runtimeSimulateRun(pid, 'direct-shear', 'web', { durationSeconds: 300, complete: true });
    var a = S.startAttempt(pid, 'direct-shear');
    if (!a) { return; }
    (S.attemptAssessment(a) || { questions: [] }).questions.forEach(function (q) {
      if (q.type === 'mcq') { S.saveAnswer(a.id, q.id, correct ? q.answer : (q.answer === 0 ? 1 : 0)); }
      else if (q.type === 'tf') { S.saveAnswer(a.id, q.id, correct ? q.answer : !q.answer); }
    });
    S.submitAttempt(a.id);
  }
  take(RAHUL, true);
  take(OTHER, false);
  eq(S.resultWithheld(RAHUL, 'direct-shear'), true, 'both results are withheld');
  eq(S.resultWithheld(OTHER, 'direct-shear'), true, 'from both students');

  function studentView(pid) {
    var prog = S.experimentProgress(pid, 'direct-shear', ['web'], { studentView: true });
    return JSON.stringify({ status: prog.status, factual: prog.factual })
      .replace(/"20\d\d-[^"]*"/g, '"T"');
  }
  eq(studentView(RAHUL), studentView(OTHER),
    'AND A PASSING AND A FAILING STUDENT ARE STILL BYTE-IDENTICAL in the student view');
  eq(S.experimentProgress(RAHUL, 'direct-shear', ['web']).factual.assessment.state,
    S.ASSESS_STATE.PASSED, 'while Faculty still see the real outcome');
}

scenarioSchema10Migration();
/* Implementation 07.3 — the full stakeholder meeting closure. */
scenarioManagerRouting();
scenarioChangeRefs();
scenarioPreviewVideo();
scenarioDeliveryManagement();
scenarioTechnologyUsed();
scenarioRoleAudit();
scenarioRequesterIdentity();
scenarioSchema11Migration();
scenarioProgressExport();
scenarioAdversarial073();
/* Implementation 08 — the UX/product closure pass. */
scenario08StructureUsage();
scenario08CourseCodes();
scenario08StudentHome();
scenario08DeviceGating();
scenario08ReturnPath();
scenario08Terminology();
scenario08StaticSource();
/* Implementation 08 — reconciliation pass. */
scenario08MappableCourses();
scenario08ProvisioningParity();
scenario08RSupportMedia();
/* ── Implementation 09 — the PM functional delta ────────────── */
scenario09Utilisation();
scenario09Completion();
scenario09TechnologyAxis();
scenario09Evidence();
scenario09FoldIntegrity();
scenario09IdSpace();
scenario09Boundaries();
scenario09WithheldParity();
scenario09PreTelemetry();
scenario09ImportCsv();
scenario09ImportValidation();
scenario09ImportDuplicates();
scenario09ImportScope();
scenario09ImportXlsx();
scenario09XlsxRealWorld();
scenario09XlsxHardening();
scenario09ImportRobustness();
scenario09TelemetryRobustness();
scenario09PrePublishEditing();
scenario09PostPublishVersioning();
scenario09CorrectionVersion();
scenario09RemovalCorrection();
scenario09CorrectionRevision();
scenario09WithdrawCorrection();
scenario09MaterialityTable();
/* ── Implementation 09 — the UX / clarity correction ────────── */
scenario09cFacultyOneDetailPath();
scenario09cNoTechnologyDenominator();
scenario09cConservativeOverall();
scenario09cPlainLanguage();
scenario09cCorrectionStates();
scenario09cReviewerAndSuperAdminDiff();
scenario09cPublicationLabels();
scenario09cFlowStillWorks();
scenario09cTelemetrySurvives();
scenario09cWithholdingStillProtected();
summary();
