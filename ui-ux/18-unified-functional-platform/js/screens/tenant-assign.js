/* ============================================================
   Unified Functional Platform — Tenant Admin · ASSIGNMENTS.

   Student / group Experiment assignment (STK31-25) and Faculty
   mapping, both bounded by the tenant's approved access (STK31-24).

   The assignment is the ONLY thing in the product that turns
   TENANT ACCESS into STUDENT ENTITLEMENT.

   Rules enforced here, not merely described:
     · only experiments inside an ACTIVE tenant access record
     · technologies are INHERITED from that record and are not
       selectable — the Tenant Admin neither widens nor narrows them
     · the approved quantity is a hard ceiling on unique active
       students per access record
     · a group that would exceed the remaining allocation is refused
       WHOLE — never partially assigned
     · a student already entitled through another source gains a
       second source, never a second entitlement
   ============================================================ */

window.XRSLP = window.XRSLP || {};
XRSLP.screens = XRSLP.screens || {};

(function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var util = XRSLP.util;
  var ui = XRSLP.ui;
  var data = XRSLP.data;
  var state = XRSLP.state;
  var T = XRSLP.tenantUI;

  /* Assignment builder draft — module-level so the dependent selects
     survive the re-render that keeps them consistent. */
  var draft = { accessId: '', experimentId: '', targetType: 'student', targets: {}, q: '', error: null };
  function resetDraft() { draft = { accessId: '', experimentId: '', targetType: 'student', targets: {}, q: '', error: null }; }
  /* Preselects an access record when arriving from Content access. */
  XRSLP.screens.tenantAssignPrefill = function (accessId) { draft.accessId = accessId; };

  var showRemoved = false;
  var fmDraft = { personId: '', accessId: '', courseId: '', experimentId: '' };

  function tabs(tenant, active) {
    function t(key, href, label) {
      return '<a class="segi" href="' + href + '"' + (active === key ? ' aria-current="page"' : '') + '>' + esc(label) + '</a>';
    }
    return '<nav class="seg" aria-label="Assignment views">' +
      t('students', T.href.assignments(tenant.id), 'Student & group assignments') +
      t('faculty', T.href.facultyMap(tenant.id), 'Faculty mapping') +
      '</nav>';
  }

  /* ============================================================
     ASSIGNMENTS LIST
     ============================================================ */
  XRSLP.screens.tenantAssignments = function (params) {
    var r = T.requireTenant(params, 'assignments');
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;

    var all = state.assignmentsForTenant(tenant.id).slice().reverse();
    /* ONE source of truth, shared with Overview and Content access. */
    var assignable = state.assignableAccessForTenant(tenant.id);
    var list = all.filter(function (a) { return showRemoved || a.status === 'active'; });
    var removedCount = all.filter(function (a) { return a.status === 'removed'; }).length;

    var body;
    if (!assignable.length && !all.length) {
      /* Never a bare "no access": name every record the institution
         actually holds and say exactly why none can be assigned from. */
      body = T.noAssignableAccessHTML(tenant, 'h2');
    } else if (!all.length) {
      body = ui.emptyState({
        icon: 'flask',
        title: 'No assignments yet',
        body: 'This institution holds approved content but no student has been given any of it. ' +
          'Holding access and entitling a student are two different things.',
        actionsHTML: T.actionsIfWritable(tenant,
          '<a class="btn pri" href="' + T.href.newAssignment(tenant.id) + '">New assignment</a>', false)
      });
    } else if (!list.length) {
      body = ui.emptyState({
        icon: 'search', title: 'No active assignments',
        body: 'Every assignment in this institution has been removed. Removed records are kept for traceability.',
        actionsHTML: '<button class="btn sec sm" type="button" id="asg-toggle-empty">Show removed assignments</button>'
      });
    } else {
      body = '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Experiment assignments in ' + esc(tenant.name) + '</caption>' +
        '<thead><tr><th scope="col">Experiment</th><th scope="col">Assigned to</th>' +
        '<th scope="col">Technologies</th><th scope="col">Students reached</th>' +
        '<th scope="col">Access record</th><th scope="col">Status</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
        list.map(function (a) {
          var rec = state.accessById(a.accessId);
          /* EFFECTIVE ENTITLEMENT, not licence holding. `accessAllocation`
             is deliberately tenant-status- and expiry-blind — it answers
             "who holds a licence", which must survive a deactivation
             untouched. Reading it here made this column claim students
             were reached while the institution was deactivated or the
             term had ended, contradicting every other surface in the
             build. `entitledStudentsFor` is the one derivation every
             learner-facing screen already answers this with. */
          var entitledHere = a.status === 'active'
            ? state.entitledStudentsFor(a.accessId, a.experimentId) : [];
          var reach = a.status === 'active'
            ? state.assignmentReach(a).filter(function (pid) {
                return entitledHere.indexOf(pid) !== -1;
              }).length
            : 0;
          var target = a.targetType === 'group'
            ? '<a class="rowlink" href="' + T.href.group(tenant.id, a.targetId) + '">' +
              '<span class="tmain">' + esc(state.assignmentTargetLabel(a)) + '</span>' +
              '<span class="tsub">Group · ' + state.memberIdsOfGroup(a.targetId).length + ' ' +
              util.plural(state.memberIdsOfGroup(a.targetId).length, 'member') + '</span></a>'
            : '<a class="rowlink" href="' + T.href.person(tenant.id, a.targetId) + '">' +
              '<span class="tmain">' + esc(state.assignmentTargetLabel(a)) + '</span>' +
              '<span class="tsub">Student · direct</span></a>';
          return '<tr' + (a.status === 'removed' ? ' class="row-off"' : '') + '>' +
            '<td data-label="Experiment">' + T.expLine(a.experimentId) + '</td>' +
            '<td data-label="Assigned to">' + target + '</td>' +
            '<td data-label="Technologies">' + ui.techBadges(rec ? state.accessTechnologies(rec, a.experimentId) : a.technologies) + '</td>' +
            '<td data-label="Students reached" class="num">' + (a.status === 'active' ? reach : '—') + '</td>' +
            '<td data-label="Access record"><span class="mono">' + esc(a.accessId) + '</span>' +
            (rec && !state.accessIsLive(rec) ? '<span class="tsub">Expired</span>' : '') + '</td>' +
            '<td data-label="Status">' + (a.status === 'active'
              ? ui.badge('b-success', 'check', 'Active')
              : ui.badge('b-neutral', 'minus', 'Removed ' + util.fmtDate(a.removedAt))) + '</td>' +
            '<td class="cell-actions">' + (a.status === 'active'
              ? T.actionsIfWritable(tenant,
                  '<button class="btn sm sec" type="button" data-unassign="' + esc(a.id) + '">Remove' +
                  '<span class="sr-only"> assignment of this experiment from ' +
                  esc(state.assignmentTargetLabel(a)) + '</span></button>', false)
              : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }

    var html =
      ui.phead('Assignments',
        'Turning the institution&rsquo;s approved content into student entitlement.',
        (assignable.length && T.canWrite(tenant)
          ? '<a class="btn pri" href="' + T.href.newAssignment(tenant.id) + '">' + ui.ic('plus') + 'New assignment</a>'
          : null)) +
      tabs(tenant, 'students') +
      /* Records exist but none is assignable, and assignments are already
         on file: explain rather than leave the missing button unexplained. */
      (!assignable.length && all.length
        ? '<div style="margin-bottom:16px">' + ui.alertBox('warning', 'No assignment can be made right now',
            '<p>' + state.unassignableAccessForTenant(tenant.id).map(function (b) {
              return '<strong>' + esc(b.record.id) + '</strong> — ' + esc(state.assignabilityText(b.reason));
            }).join('; ') + '. Existing assignments below are unchanged.</p>') + '</div>'
        : '') +
      (assignable.length ? '<div class="stack" style="margin-bottom:16px">' + assignable.map(function (rec) {
        var alloc = state.accessAllocation(rec.id);
        return '<div class="allocrow"><div class="ar-id"><span class="mono">' + esc(rec.id) + '</span>' +
          '<span class="ar-sub">' + rec.items.length + ' ' + util.plural(rec.items.length, 'experiment') + '</span></div>' +
          T.allocMeter(alloc) + '</div>';
      }).join('') + '</div>' : '') +
      '<div class="tablecard">' +
      (removedCount ? '<div class="listbar">' +
        '<label class="chk"><input type="checkbox" id="asg-removed"' + (showRemoved ? ' checked' : '') + '> ' +
        'Show removed assignments</label>' +
        '<span class="lcount">' + list.length + ' shown · ' + removedCount + ' removed</span></div>' : '') +
      body + '</div>';

    return {
      title: 'Assignments — ' + tenant.name, html: html, tenant: tenant, navKey: 'assignments',
      after: function () {
        var t = document.getElementById('asg-removed');
        if (t) {
          t.addEventListener('change', function () {
            showRemoved = t.checked;
            XRSLP.render(true);
            var again = document.getElementById('asg-removed');
            if (again) { again.focus(); }
          });
        }
        var te = document.getElementById('asg-toggle-empty');
        if (te) {
          te.addEventListener('click', function () { showRemoved = true; XRSLP.render(false); });
        }
        Array.prototype.slice.call(document.querySelectorAll('[data-unassign]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-unassign');
            var a = state.assignmentById(id);
            if (!a) { return; }
            /* Explain exactly what removing this source does — including
               the students who keep the experiment through another. */
            var keep = state.assignmentReach(a).filter(function (pid) {
              var others = state.entitlementSources(pid, a.accessId, a.experimentId)
                .filter(function (s) { return s.assignmentId !== a.id; });
              var p = state.personById(pid);
              return others.length && p && p.status === 'active';
            }).length;
            var ctx = data.contextOf(a.experimentId);
            ui.openDialog({
              title: 'Remove this assignment?',
              bodyHTML: '<p>Remove <strong>' + esc(ctx ? ctx.experiment.name : a.experimentId) + '</strong> from ' +
                '<strong>' + esc(state.assignmentTargetLabel(a)) + '</strong>?</p>' +
                '<div class="consequence">' + ui.ic('info') + '<span>' +
                (keep ? keep + ' ' + util.plural(keep, 'student') + ' ' + (keep === 1 ? 'keeps' : 'keep') +
                  ' this experiment through another assignment source. ' : '') +
                'Every other student reached only by this assignment loses the entitlement. ' +
                'The assignment record itself is retained as history.</span></div>',
              okLabel: 'Remove assignment',
              onConfirm: function () {
                state.removeAssignment(id);
                ui.toast('Assignment removed. Entitlement supported by another source is unchanged.');
                XRSLP.render(false);
              }
            });
          });
        });
      }
    };
  };

  /* ============================================================
     NEW ASSIGNMENT
     ============================================================ */
  XRSLP.screens.tenantNewAssignment = function (params) {
    var r = T.requireTenant(params, 'assignments', { write: true, what: 'Assigning an experiment' });
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;

    var live = state.assignableAccessForTenant(tenant.id);
    if (!live.length) {
      return {
        title: 'New assignment', tenant: tenant, navKey: 'assignments',
        html: ui.crumbs([{ label: 'Assignments', href: T.href.assignments(tenant.id) }, { label: 'New assignment' }]) +
          ui.phead('New assignment') +
          '<div class="tablecard">' + T.noAssignableAccessHTML(tenant, 'h2') + '</div>'
      };
    }

    /* keep the draft coherent */
    if (draft.accessId && !live.filter(function (a) { return a.id === draft.accessId; }).length) { resetDraft(); }
    if (!draft.accessId && live.length === 1) { draft.accessId = live[0].id; }
    var rec = draft.accessId ? state.accessById(draft.accessId) : null;
    if (rec && draft.experimentId && !state.accessHasExperiment(rec, draft.experimentId)) { draft.experimentId = ''; }

    var alloc = rec ? state.accessAllocation(rec.id) : null;
    var techs = rec && draft.experimentId ? state.accessTechnologies(rec, draft.experimentId) : [];

    /* ---- step 1: access record ---- */
    var step1 =
      '<div class="field" id="na-acc"><label for="na-acc-i">Content access record <span class="req" aria-hidden="true">*</span>' +
      '<span class="sr-only">(required)</span></label>' +
      '<select id="na-acc-i">' +
      '<option value="">Select an access record…</option>' +
      live.map(function (a) {
        return '<option value="' + esc(a.id) + '"' + (draft.accessId === a.id ? ' selected' : '') + '>' +
          esc(T.accessOptionLabel(a)) + '</option>';
      }).join('') + '</select>' +
      '<p class="hint">Only records the Super Admin has approved and activated for ' + esc(tenant.name) + ' appear here.</p></div>' +
      (alloc ? T.allocMeter(alloc) : '');

    /* ---- step 2: experiment ---- */
    var step2 = '<div class="field" id="na-exp"><label for="na-exp-i">Experiment <span class="req" aria-hidden="true">*</span>' +
      '<span class="sr-only">(required)</span></label>' +
      '<select id="na-exp-i"' + (rec ? '' : ' disabled') + '>' +
      (rec
        ? '<option value="">Select an experiment…</option>' + rec.items.map(function (item) {
            var ctx = data.contextOf(item.experimentId);
            return '<option value="' + esc(item.experimentId) + '"' +
              (draft.experimentId === item.experimentId ? ' selected' : '') + '>' +
              esc((ctx ? ctx.course.name + ' — ' + ctx.experiment.name : item.experimentId)) + '</option>';
          }).join('')
        : '<option value="">Select an access record first…</option>') +
      '</select></div>' +
      (draft.experimentId
        ? '<div class="techinherit">' +
          '<div class="ti-k">Technologies granted by ' + esc(draft.accessId) + '</div>' +
          '<div class="ti-v">' + ui.techBadges(techs) + '</div>' +
          '<p class="ti-n">Inherited from the approved access record. The institution cannot add a technology it was ' +
          'not approved for, and does not remove one it was.</p></div>'
        : '');

    /* ---- step 3: targets ---- */
    var students = state.studentsForTenant(tenant.id);
    var activeStudents = students.filter(function (p) { return p.status === 'active'; });
    var groups = state.groupsForTenant(tenant.id);

    function targetRadio(v, label, note) {
      return '<label class="radiorow"><input type="radio" name="na-tt" value="' + v + '"' +
        (draft.targetType === v ? ' checked' : '') + '>' +
        '<span><span class="rr-t">' + esc(label) + '</span>' +
        '<span class="rr-n">' + esc(note) + '</span></span></label>';
    }

    var targetList;
    if (draft.targetType === 'student') {
      var shown = activeStudents.filter(function (p) {
        if (!draft.q) { return true; }
        var hay = (p.name + ' ' + (p.studentId || '') + ' ' + p.email).toLowerCase();
        return hay.indexOf(draft.q.toLowerCase()) !== -1;
      });
      targetList = !activeStudents.length
        ? ui.emptyState({ icon: 'users', heading: 'h3', title: 'No active students',
            body: 'Add or import students before assigning content. Inactive students cannot receive assignments.',
            actionsHTML: '<a class="btn sec sm" href="' + T.href.people(tenant.id) + '">Open People</a>' })
        : '<div class="searchbox" style="margin-bottom:12px">' + ui.ic('search') +
          '<label class="sr-only" for="na-q">Search students</label>' +
          '<input type="text" id="na-q" placeholder="Search students" value="' + esc(draft.q) + '"></div>' +
          (shown.length
            ? '<fieldset class="picklist"><legend class="sr-only">Students to assign this experiment to</legend>' +
              shown.map(function (p) {
                var already = rec && draft.experimentId
                  ? state.entitlementSources(p.id, draft.accessId, draft.experimentId) : [];
                var counted = alloc && (alloc.entitledIds.indexOf(p.id) !== -1 || alloc.heldIds.indexOf(p.id) !== -1);
                return '<label class="pick"><input type="checkbox" name="na-target" value="' + esc(p.id) + '"' +
                  (draft.targets[p.id] ? ' checked' : '') + '>' +
                  '<span class="pk-b"><span class="pk-t">' + esc(p.name) + '</span>' +
                  '<span class="pk-s">' + esc(p.studentId || '') +
                  (counted ? ' · already holds a licence on this record' : '') +
                  (already.length ? ' · already entitled via ' +
                    esc(already.map(function (s) { return s.type === 'group' ? s.label : 'a direct assignment'; }).join(', ')) : '') +
                  '</span></span></label>';
              }).join('') + '</fieldset>'
            : ui.emptyState({ icon: 'search', heading: 'h3', title: 'No students match', body: 'Try a different search.' })) +
          '<p class="cardfoot">Inactive students are not listed: an inactive student cannot receive a new assignment.</p>';
    } else {
      targetList = !groups.length
        ? ui.emptyState({ icon: 'users', heading: 'h3', title: 'No student groups',
            body: 'Create a group first, or assign to individual students instead.',
            actionsHTML: T.actionsIfWritable(tenant,
              '<a class="btn sec sm" href="' + T.href.newGroup(tenant.id) + '">Create group</a>', false) })
        : '<fieldset class="picklist"><legend class="sr-only">Groups to assign this experiment to</legend>' +
          groups.map(function (g) {
            var mem = state.membersOfGroup(g.id);
            var act = mem.filter(function (m) { return m.status === 'active'; }).length;
            return '<label class="pick"><input type="checkbox" name="na-target" value="' + esc(g.id) + '"' +
              (draft.targets[g.id] ? ' checked' : '') + '>' +
              '<span class="pk-b"><span class="pk-t">' + esc(g.name) + '</span>' +
              '<span class="pk-s">' + mem.length + ' ' + util.plural(mem.length, 'member') +
              ' · ' + act + ' active</span></span></label>';
          }).join('') + '</fieldset>' +
          '<p class="cardfoot">A group assignment is all-or-nothing. If its new students would exceed the remaining ' +
          'allocation, nothing is assigned — the group is never partially applied.</p>';
    }

    /* ---- live preview of the consequence ---- */
    var selected = Object.keys(draft.targets).filter(function (k) { return draft.targets[k]; });
    var pre = (draft.accessId && draft.experimentId && selected.length)
      ? state.previewAssignment(tenant.id, draft.accessId, draft.experimentId, draft.targetType, selected)
      : null;

    var consequence = '';
    if (pre) {
      var lines = [];
      /* On a blocked attempt this figure is already stated in the
         capacity facts below, so it is not repeated here. */
      if (pre.ok) {
        lines.push('<li><strong>' + pre.newStudentIds.length + '</strong> new ' +
          util.plural(pre.newStudentIds.length, 'student') + ' would consume a licence on ' + esc(draft.accessId) + '.</li>');
      }
      if (pre.countedStudentIds.length) {
        lines.push('<li><strong>' + pre.countedStudentIds.length + '</strong> already hold a licence on this record — ' +
          'they consume nothing further.</li>');
      }
      if (pre.alreadyEntitled.length) {
        lines.push('<li><strong>' + pre.alreadyEntitled.length + '</strong> ' +
          util.plural(pre.alreadyEntitled.length, 'student') + ' already entitled to this experiment: ' +
          pre.alreadyEntitled.map(function (x) {
            var p = state.personById(x.personId);
            return esc((p ? p.name : x.personId) + ' — via ' + x.sources.map(function (s) {
              return s.type === 'group' ? s.label : 'a direct assignment';
            }).join(', '));
          }).join('; ') + '. They gain another assignment source, not another entitlement.</li>');
      }
      if (pre.inactiveStudentIds.length) {
        lines.push('<li><strong>' + pre.inactiveStudentIds.length + '</strong> inactive ' +
          util.plural(pre.inactiveStudentIds.length, 'student') + ' would be skipped — an inactive student holds no entitlement.</li>');
      }
      if (pre.duplicateTargets.length) {
        lines.push('<li><strong>' + pre.duplicateTargets.length + '</strong> already have exactly this assignment and are skipped.</li>');
      }
      if (pre.emptyGroups.length) {
        lines.push('<li>' + pre.emptyGroups.length + ' selected ' + util.plural(pre.emptyGroups.length, 'group') +
          ' currently ' + (pre.emptyGroups.length === 1 ? 'has' : 'have') + ' no members — the assignment would reach nobody yet.</li>');
      }
      /* A projection of the new remaining allocation belongs ONLY to a
         transaction that will actually happen. A blocked attempt changes
         nothing, so it reports the current figures as facts instead —
         never "would go to 0" for a state change that never occurs. */
      if (pre.ok) {
        lines.push('<li>Remaining allocation would go from <strong>' + pre.alloc.remaining + '</strong> to <strong>' +
          (pre.alloc.remaining - pre.newStudentIds.length) + '</strong>.</li>');
      }

      var targetWord = (draft.targetType === 'group' && selected.length === 1) ? 'group' : 'selection';
      var newCount = pre.newStudentIds.length;
      /* Display-only arithmetic — no state is read or written here. */
      var shortfall = Math.max(0, newCount - pre.alloc.remaining);

      /* Present-tense capacity facts, shown on every blocked attempt. */
      var capacityHTML = !pre.ok
        ? '<ul class="caplist">' +
            '<li><span>Approved licences</span><strong class="tabular">' + pre.alloc.approved + '</strong></li>' +
            '<li><span>Assigned students</span><strong class="tabular">' + pre.alloc.assigned + '</strong></li>' +
            '<li><span>Remaining allocation</span><strong class="tabular">' + pre.alloc.remaining + '</strong></li>' +
            '<li><span>This ' + esc(targetWord) + ' would add</span><strong class="tabular">' + newCount +
              ' new ' + util.plural(newCount, 'student') + '</strong></li>' +
          '</ul>'
        : '';

      var blockText = null;
      if (!pre.ok) {
        blockText =
          pre.reason === 'over-allocation'
            ? 'Assignment blocked — this ' + targetWord + ' requires ' + shortfall + ' more ' +
              util.plural(shortfall, 'licence') + ' on ' + draft.accessId + '. ' +
              'No part of the selection is applied. Free a licence by removing an assignment or deactivating a ' +
              'student, or ask the Super Admin to revise the approved quantity.'
          : pre.reason === 'duplicate'
            ? 'Assignment blocked — everything selected already has exactly this assignment.'
          : pre.reason === 'inactive-target'
            ? 'Assignment blocked — every selected student is inactive, and an inactive student cannot receive a new assignment.'
          : pre.reason === 'access-expired'
            ? 'Assignment blocked — this access record has expired, so it can no longer entitle anyone.'
          : pre.reason === 'not-assignable'
            ? 'Assignment blocked — nothing can be assigned from this access record because ' +
              state.assignabilityText(pre.blockedBy) + '.'
          : pre.reason === 'not-approved'
            ? 'Assignment blocked — that experiment is not part of this access record.'
          : pre.reason === 'other-tenant-target'
            ? 'Assignment blocked — a selected student or group does not belong to this institution.'
            : 'Assignment blocked — this assignment cannot be made.';
      }

      /* One closing sentence on every blocked attempt: nothing changed. */
      var unchangedText = !pre.ok
        ? 'Nothing has been assigned and remaining allocation stays at ' + pre.alloc.remaining + '.'
        : null;

      consequence = ui.alertBox(pre.ok ? 'info' : 'danger',
        pre.ok ? 'What this assignment will do' : 'This assignment is blocked',
        capacityHTML +
        (blockText ? '<p>' + esc(blockText) + '</p>' : '') +
        (unchangedText ? '<p class="capsafe">' + esc(unchangedText) + '</p>' : '') +
        '<ul style="margin:6px 0 0 16px">' + lines.join('') + '</ul>',
        pre.ok ? null : 'alert');
    }

    var canSubmit = pre && pre.ok;

    var html =
      ui.crumbs([{ label: 'Assignments', href: T.href.assignments(tenant.id) }, { label: 'New assignment' }]) +
      ui.phead('New assignment', 'Assign an approved experiment to students or a group.') +
      '<form id="na-form" novalidate><div class="stack">' +
      ui.card('1 · Approved content', step1 + step2, null, 'h2') +
      ui.card('2 · Who receives it',
        '<fieldset class="fgroup"><legend>Assign to</legend>' +
        targetRadio('student', 'Individual students', 'Pick one or more students directly.') +
        targetRadio('group', 'Student groups', 'One assignment reaching every active member.') +
        '</fieldset>' + targetList, null, 'h2') +
      (consequence ? '<div>' + consequence + '</div>' : '') +
      '<div class="formact">' +
      '<button class="btn pri" type="submit" id="na-save"' + (canSubmit ? '' : ' disabled aria-disabled="true"') + '>' +
      'Create assignment</button>' +
      '<a class="btn sec" href="' + T.href.assignments(tenant.id) + '">Cancel</a>' +
      (canSubmit ? '' : '<span class="formnote">Choose an access record, an experiment and at least one valid target.</span>') +
      '</div></div></form>';

    return {
      title: 'New assignment', html: html, tenant: tenant, navKey: 'assignments',
      after: function () {
        function rerender(focusId) {
          XRSLP.render(true);
          var el = document.getElementById(focusId);
          if (el) {
            el.focus();
            if (el.setSelectionRange && el.type === 'text') { el.setSelectionRange(el.value.length, el.value.length); }
          }
        }
        var accSel = document.getElementById('na-acc-i');
        if (accSel) {
          accSel.addEventListener('change', function () {
            draft.accessId = accSel.value;
            draft.experimentId = '';
            draft.targets = {};
            rerender('na-acc-i');
          });
        }
        var expSel = document.getElementById('na-exp-i');
        if (expSel) {
          expSel.addEventListener('change', function () {
            draft.experimentId = expSel.value;
            rerender('na-exp-i');
          });
        }
        Array.prototype.slice.call(document.querySelectorAll('input[name="na-tt"]')).forEach(function (radio) {
          radio.addEventListener('change', function () {
            draft.targetType = radio.value;
            draft.targets = {};
            draft.q = '';
            XRSLP.render(true);
            var again = document.querySelector('input[name="na-tt"][value="' + radio.value + '"]');
            if (again) { again.focus(); }
          });
        });
        var q = document.getElementById('na-q');
        if (q) { q.addEventListener('input', function () { draft.q = q.value; rerender('na-q'); }); }

        Array.prototype.slice.call(document.querySelectorAll('input[name="na-target"]')).forEach(function (box) {
          box.addEventListener('change', function () {
            if (box.checked) { draft.targets[box.value] = true; }
            else { delete draft.targets[box.value]; }
            XRSLP.render(true);
            var again = document.querySelector('input[name="na-target"][value="' + box.value.replace(/"/g, '\\"') + '"]');
            if (again) { again.focus(); }
          });
        });

        var form = document.getElementById('na-form');
        if (form) {
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            var picked = Object.keys(draft.targets).filter(function (k) { return draft.targets[k]; });
            var result = state.assignExperiment(tenant.id, draft.accessId, draft.experimentId, draft.targetType, picked);
            if (!result.ok) {
              ui.announce('Assignment blocked.');
              XRSLP.render(false);
              return;
            }
            var ctx = data.contextOf(draft.experimentId);
            var n = result.preview.newStudentIds.length;
            ui.toast((ctx ? ctx.experiment.name : 'Experiment') + ' assigned — ' +
              n + ' new ' + util.plural(n, 'student') + ' entitled, ' +
              Math.max(0, result.preview.alloc.remaining - n) + ' ' +
              util.plural(Math.max(0, result.preview.alloc.remaining - n), 'licence') + ' remaining.');
            resetDraft();
            XRSLP.router.go(T.href.assignments(tenant.id));
          });
        }
      }
    };
  };

  /* ============================================================
     FACULTY MAPPING
     Faculty are mapped to a Course context and/or a specific
     Experiment inside the approved access. This is the Tenant Admin
     side of that boundary; the Faculty workspace it authorises is
     js/screens/faculty.js and js/screens/faculty-assess.js.
     ============================================================ */
  XRSLP.screens.tenantFacultyMapping = function (params) {
    /* Readable while deactivated — the existing mappings are history and
       stay visible; only the form and the Remove controls are withdrawn. */
    var r = T.requireTenant(params, 'assignments');
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;

    var faculty = state.facultyForTenant(tenant.id);
    var live = state.assignableAccessForTenant(tenant.id);
    var maps = state.facultyMappingsForTenant(tenant.id);

    if (fmDraft.accessId && !live.filter(function (a) { return a.id === fmDraft.accessId; }).length) {
      fmDraft = { personId: '', accessId: '', courseId: '', experimentId: '' };
    }
    var frec = fmDraft.accessId ? state.accessById(fmDraft.accessId) : null;
    var courseIds = frec ? state.accessCourseIds(frec) : [];
    if (fmDraft.courseId && courseIds.indexOf(fmDraft.courseId) === -1) { fmDraft.courseId = ''; fmDraft.experimentId = ''; }
    var expOptions = frec && fmDraft.courseId
      ? frec.items.filter(function (i) {
          var ctx = data.contextOf(i.experimentId);
          return ctx && ctx.course.id === fmDraft.courseId;
        })
      : [];

    var listBody = maps.length
      ? '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Faculty mapped to approved content</caption>' +
        '<thead><tr><th scope="col">Faculty</th><th scope="col">Course</th><th scope="col">Experiment</th>' +
        '<th scope="col">Access record</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
        maps.map(function (m) {
          var p = state.personById(m.personId);
          var c = data.course(m.courseId);
          return '<tr>' +
            '<td data-label="Faculty">' + (p ? T.personLink(tenant.id, p) : esc(m.personId)) + '</td>' +
            '<td data-label="Course">' + esc(c ? c.name : m.courseId) + '</td>' +
            '<td data-label="Experiment">' + (m.experimentId ? T.expLine(m.experimentId) :
              '<span class="muted">Whole course context</span>') + '</td>' +
            '<td data-label="Access record"><span class="mono">' + esc(m.accessId) + '</span></td>' +
            '<td class="cell-actions">' + T.actionsIfWritable(tenant,
              '<button class="btn sm sec" type="button" data-unmap="' + esc(m.id) + '">Remove' +
              '<span class="sr-only"> mapping for ' + esc(p ? p.name : '') + '</span></button>', false) +
            '</td></tr>';
        }).join('') + '</tbody></table></div>'
      : ui.emptyState({
          icon: 'users',
          title: 'No Faculty mapped yet',
          body: faculty.length
            /* ui.emptyState ESCAPES `body`, so an HTML entity here would render
               as the literal text "institution&rsquo;s". A string that is
               escaped rather than parsed must carry real punctuation. */
            ? 'Map a Faculty member to a course or a specific experiment inside the institution’s approved access.'
            : 'Add Faculty to this institution first.',
          actionsHTML: faculty.length ? '' : T.actionsIfWritable(tenant,
            '<a class="btn pri" href="' + T.href.addFaculty(tenant.id) + '">Add Faculty</a>', false)
        });

    var formCard = (!faculty.length || !live.length)
      ? ui.alertBox('info', 'Mapping needs Faculty and approved content',
          '<p>' + (!faculty.length ? 'This institution has no Faculty records yet. ' : '') +
          (!live.length ? 'It also holds no active content access, so there is nothing to map to. ' : '') +
          'Faculty can only be mapped to content the institution is approved to use.</p>')
      : ui.card('Map a Faculty member',
          '<form id="fm-form" novalidate><div class="form-errors"></div>' +
          '<div class="frow">' +
          '<div class="field" id="fm-p"><label for="fm-p-i">Faculty <span class="req" aria-hidden="true">*</span>' +
          '<span class="sr-only">(required)</span></label><select id="fm-p-i">' +
          '<option value="">Select a Faculty member…</option>' +
          faculty.map(function (p) {
            return '<option value="' + esc(p.id) + '"' + (fmDraft.personId === p.id ? ' selected' : '') + '>' +
              esc(p.name) + (p.facultyId ? ' — ' + esc(p.facultyId) : '') + '</option>';
          }).join('') + '</select></div>' +
          '<div class="field" id="fm-a"><label for="fm-a-i">Access record <span class="req" aria-hidden="true">*</span>' +
          '<span class="sr-only">(required)</span></label><select id="fm-a-i">' +
          '<option value="">Select an access record…</option>' +
          live.map(function (a) {
            return '<option value="' + esc(a.id) + '"' + (fmDraft.accessId === a.id ? ' selected' : '') + '>' +
              esc(T.accessOptionLabel(a)) + '</option>';
          }).join('') + '</select></div>' +
          '</div>' +
          '<div class="frow">' +
          '<div class="field" id="fm-c"><label for="fm-c-i">Course <span class="req" aria-hidden="true">*</span>' +
          '<span class="sr-only">(required)</span></label><select id="fm-c-i"' + (frec ? '' : ' disabled') + '>' +
          (frec
            ? '<option value="">Select a course…</option>' + courseIds.map(function (cid) {
                var c = data.course(cid);
                return '<option value="' + esc(cid) + '"' + (fmDraft.courseId === cid ? ' selected' : '') + '>' +
                  esc(c ? c.name : cid) + '</option>';
              }).join('')
            : '<option value="">Select an access record first…</option>') + '</select></div>' +
          '<div class="field" id="fm-e"><label for="fm-e-i">Experiment</label>' +
          '<select id="fm-e-i"' + (fmDraft.courseId ? '' : ' disabled') + '>' +
          '<option value="">Whole course context</option>' +
          expOptions.map(function (i) {
            var ctx = data.contextOf(i.experimentId);
            return '<option value="' + esc(i.experimentId) + '"' +
              (fmDraft.experimentId === i.experimentId ? ' selected' : '') + '>' +
              esc(ctx ? ctx.experiment.name : i.experimentId) + '</option>';
          }).join('') + '</select>' +
          '<p class="hint">Optional. Leave as “Whole course context” to map the course rather than one experiment.</p></div>' +
          '</div>' +
          '<div class="formact">' + T.actionsIfWritable(tenant,
            '<button class="btn pri" type="submit" id="fm-save">Map Faculty</button>',
            'New Faculty mappings cannot be made while the institution is deactivated. Existing mappings ' +
            'are preserved and reappear as soon as it is reactivated.') + '</div>' +
          '</form>', null, 'h2');

    var html =
      ui.phead('Faculty mapping', 'Faculty mapped to content inside ' + esc(tenant.name) + '&rsquo;s approved access.') +
      tabs(tenant, 'faculty') +
      '<div class="stack">' +
      ui.alertBox('info', 'Faculty mapping does not consume the student allocation',
        '<p>The approved quantity on an access record is a student/user allocation. Mapping a Faculty member does not ' +
        'take one of those licences, and does not entitle any student.</p>') +
      formCard +
      ui.card('Current mappings',
        listBody +
        /* Implementation 04 BUILT the Faculty workspace, so the note that
           used to stand here — "assessment authoring … are a later slice" —
           was describing a gap that no longer exists. What is useful to a
           Tenant Admin now is what mapping actually unlocks. */
        '<p class="cardfoot">Faculty members manage assessments, reviews and Student progress from the ' +
        'Faculty workspace once they are mapped here.</p>',
        maps.length + ' ' + util.plural(maps.length, 'mapping'), 'h2') +
      '</div>';

    return {
      title: 'Faculty mapping — ' + tenant.name, html: html, tenant: tenant, navKey: 'assignments',
      after: function () {
        function bind(id, key, clear) {
          var el = document.getElementById(id);
          if (!el) { return; }
          el.addEventListener('change', function () {
            fmDraft[key] = el.value;
            (clear || []).forEach(function (k) { fmDraft[k] = ''; });
            XRSLP.render(true);
            var again = document.getElementById(id);
            if (again) { again.focus(); }
          });
        }
        bind('fm-p-i', 'personId');
        bind('fm-a-i', 'accessId', ['courseId', 'experimentId']);
        bind('fm-c-i', 'courseId', ['experimentId']);
        bind('fm-e-i', 'experimentId');

        var form = document.getElementById('fm-form');
        if (form) {
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            var errs = [];
            if (!fmDraft.personId) { errs.push({ field: 'fm-p', message: 'Select a Faculty member.' }); }
            if (!fmDraft.accessId) { errs.push({ field: 'fm-a', message: 'Select an access record.' }); }
            if (!fmDraft.courseId) { errs.push({ field: 'fm-c', message: 'Select a course.' }); }
            if (fmDraft.personId && fmDraft.accessId && fmDraft.courseId &&
                state.facultyMappingExists(tenant.id, fmDraft.personId, fmDraft.accessId, fmDraft.courseId, fmDraft.experimentId || null)) {
              errs.push({ field: 'fm-c', message: 'This Faculty member is already mapped to exactly this content.' });
            }
            if (!ui.showErrors(form, errs, 'Faculty not mapped')) { return; }
            var m = state.mapFaculty(tenant.id, fmDraft.personId, fmDraft.accessId, fmDraft.courseId, fmDraft.experimentId || null);
            if (!m) {
              ui.showErrors(form, [{ field: 'fm-c', message: 'That content is not inside the selected access record.' }],
                'Faculty not mapped');
              return;
            }
            var p = state.personById(fmDraft.personId);
            fmDraft = { personId: '', accessId: '', courseId: '', experimentId: '' };
            ui.toast((p ? p.name : 'Faculty') + ' mapped. No student licence was consumed.');
            XRSLP.render(false);
          });
        }
        /* Removing a mapping has a consequence that used to be silent:
           a descriptive review is reachable ONLY through a Faculty ↔
           Experiment mapping, so removing the last mapping covering an
           Experiment leaves a submitted written answer with no evaluator
           while the Student is still told it is with their faculty
           (STK31-31). Nothing is destroyed and re-mapping restores the
           queue — but the consequence is stated before it is taken, the
           way every other consequential control on this screen does.

           Only the MAPPING FACT is shown. No answer, mark or student
           name from the review is exposed here: the review queue belongs
           to Faculty, not to the Tenant Admin. */
        Array.prototype.slice.call(document.querySelectorAll('[data-unmap]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var mid = btn.getAttribute('data-unmap');
            var losing = state.pendingReviewsLosingEvaluator(mid);
            function commit() {
              state.removeFacultyMapping(mid);
              ui.toast('Faculty mapping removed.');
              XRSLP.render(false);
            }
            if (!losing.length) { commit(); return; }
            ui.openDialog({
              title: 'Remove this Faculty mapping?',
              bodyHTML:
                '<p>Removing this mapping leaves <strong>' + losing.length + '</strong> submitted written ' +
                XRSLP.util.plural(losing.length, 'response') + ' with <strong>no mapped Faculty evaluator</strong>.</p>' +
                '<div class="consequence">' + ui.ic('alertCirc') + '<span>Those students stay at ' +
                '<em>Pending Faculty review</em>, cannot retake, and cannot complete the experiment until a ' +
                'Faculty member is mapped to it again.</span></div>' +
                '<div class="consequence">' + ui.ic('check') + '<span><strong>Nothing is deleted.</strong> The ' +
                'responses, marks and history are all kept, and mapping a Faculty member to this content again ' +
                'puts them straight back in that person&rsquo;s review queue.</span></div>',
              okLabel: 'Remove mapping',
              onConfirm: commit
            });
          });
        });
      }
    };
  };
})();
