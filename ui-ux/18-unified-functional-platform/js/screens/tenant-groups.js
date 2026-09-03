/* ============================================================
   Unified Functional Platform — Tenant Admin · GROUPS + ACADEMIC
   MAPPINGS.

   Groups (STK31-25) are an operational assignment convenience. No
   academic semantics are invented for them: a group has a name, an
   optional description and members. A student may belong to several.

   ⚠ GROUP MEMBERSHIP ≠ CONTENT ACCESS. Membership decides which
   assignments reach a student; only an assignment creates entitlement.

   Academic mappings (STK31-11) sit BESIDE the canonical Course, never
   over it: the tenant records a local Course Code and an OPTIONAL
   Semester. The canonical Course name is displayed unchanged and
   cannot be edited here (STK31-10).
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

  var memberQ = '';

  /* ============================================================
     GROUPS LIST
     ============================================================ */
  XRSLP.screens.tenantGroups = function (params) {
    var r = T.requireTenant(params, 'groups');
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;

    var groups = state.groupsForTenant(tenant.id);
    var students = state.studentsForTenant(tenant.id);

    var body;
    if (!groups.length) {
      body = ui.emptyState({
        icon: 'users',
        title: 'No student groups yet',
        body: students.length
          ? 'Groups let one assignment reach a whole cohort at once. A student may belong to several groups, and being in a group grants nothing by itself.'
          : 'Add students first, then group them. A group is only an assignment convenience — it grants nothing by itself.',
        actionsHTML: T.actionsIfWritable(tenant,
          '<a class="btn pri" href="' + T.href.newGroup(tenant.id) + '">Create group</a>' +
          (students.length ? '' : '<a class="btn sec" href="' + T.href.addStudent(tenant.id) + '">Add Student</a>'), false)
      });
    } else {
      body = '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Student groups in ' + esc(tenant.name) + '</caption>' +
        '<thead><tr><th scope="col">Group</th><th scope="col">Members</th>' +
        '<th scope="col">Active members</th><th scope="col">Assignments</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
        groups.map(function (g) {
          var members = state.membersOfGroup(g.id);
          var active = members.filter(function (m) { return m.status === 'active'; }).length;
          var asg = state.activeAssignments(tenant.id).filter(function (a) {
            return a.targetType === 'group' && a.targetId === g.id;
          }).length;
          return '<tr>' +
            '<td data-label="Group"><a class="rowlink" href="' + T.href.group(tenant.id, g.id) + '">' +
            '<span class="tmain">' + esc(g.name) + '</span>' +
            (g.description ? '<span class="tsub">' + esc(g.description) + '</span>' : '') + '</a></td>' +
            '<td data-label="Members" class="num">' + members.length + '</td>' +
            '<td data-label="Active members" class="num">' + active + '</td>' +
            '<td data-label="Assignments" class="num">' + asg + '</td>' +
            '<td class="cell-actions"><a class="btn sm sec" href="' + T.href.group(tenant.id, g.id) + '">Open</a></td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>';
    }

    var html =
      ui.phead('Student groups',
        groups.length + ' ' + util.plural(groups.length, 'group') + ' in ' + esc(tenant.name),
        T.actionsIfWritable(tenant,
          '<a class="btn pri" href="' + T.href.newGroup(tenant.id) + '">' + ui.ic('plus') + 'Create group</a>', false)) +
      '<div class="tablecard">' + body + '</div>' +
      '<div style="margin-top:16px">' + ui.alertBox('info', 'A group is not access',
        '<p>Putting a student in a group gives them nothing. It only decides which students an assignment reaches ' +
        'when that assignment targets the group.</p>') + '</div>';

    return { title: 'Groups — ' + tenant.name, html: html, tenant: tenant, navKey: 'groups' };
  };

  /* ============================================================
     CREATE GROUP
     ============================================================ */
  XRSLP.screens.tenantNewGroup = function (params) {
    var r = T.requireTenant(params, 'groups', { write: true, what: 'Creating a student group' });
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;

    var html =
      ui.crumbs([{ label: 'Groups', href: T.href.groups(tenant.id) }, { label: 'Create group' }]) +
      ui.phead('Create student group') +
      '<div class="formwrap">' +
      '<form id="grp-form" novalidate><div class="form-errors"></div>' +
      ui.card('Group',
        '<div class="field" id="gf-name"><label for="gf-name-i">Group name <span class="req" aria-hidden="true">*</span>' +
        '<span class="sr-only">(required)</span></label><input type="text" id="gf-name-i" autocomplete="off" required></div>' +
        '<div class="field" id="gf-desc"><label for="gf-desc-i">Description</label>' +
        '<textarea id="gf-desc-i" rows="2"></textarea>' +
        '<p class="hint">Optional. A short note about what this group is for.</p></div>', null, 'h2') +
      '<div class="formact">' +
      '<button class="btn pri" type="submit" id="grp-save">Create group</button>' +
      '<a class="btn sec" href="' + T.href.groups(tenant.id) + '">Cancel</a></div></form>' +
      '<div class="formaside">' + ui.gapNote('BY DESIGN',
        '<strong>No academic semantics.</strong> A group carries a name and members and nothing else. ' +
        'Programme, Course and Semester belong to the academic mapping, not to a group.') + '</div>' +
      '</div>';

    return {
      title: 'Create group', html: html, tenant: tenant, navKey: 'groups',
      after: function () {
        var form = document.getElementById('grp-form');
        if (!form) { return; }
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var name = document.getElementById('gf-name-i').value.trim();
          var desc = document.getElementById('gf-desc-i').value.trim();
          var errs = [];
          if (!name) { errs.push({ field: 'gf-name', message: 'Enter a group name.' }); }
          else if (state.groupByName(tenant.id, name)) {
            errs.push({ field: 'gf-name', message: 'A group with this name already exists in ' + tenant.name + '.' });
          }
          if (!ui.showErrors(form, errs, 'Group not created')) { return; }
          document.getElementById('grp-save').disabled = true;
          var g = state.createGroup(tenant.id, { name: name, description: desc });
          ui.toast('Group “' + g.name + '” created.');
          XRSLP.router.go(T.href.group(tenant.id, g.id));
        });
      }
    };
  };

  /* ============================================================
     GROUP DETAIL — membership editing
     ============================================================ */
  XRSLP.screens.tenantGroup = function (params) {
    var r = T.requireTenant(params, 'groups');
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;
    var g = state.groupById(params.groupId);
    if (!g || g.tenantId !== tenant.id) {
      return {
        title: 'Group not found', tenant: tenant, navKey: 'groups',
        html: ui.crumbs([{ label: 'Groups', href: T.href.groups(tenant.id) }, { label: 'Not found' }]) +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'alertCirc', title: 'Group not found',
            body: 'No group with this identifier exists in ' + tenant.name + '.',
            actionsHTML: '<a class="btn pri" href="' + T.href.groups(tenant.id) + '">Back to Groups</a>'
          }) + '</div>'
      };
    }

    var members = state.membersOfGroup(g.id);
    var memberIds = members.map(function (m) { return m.id; });
    var candidates = state.studentsForTenant(tenant.id).filter(function (p) {
      return memberIds.indexOf(p.id) === -1;
    });
    var shown = candidates.filter(function (p) {
      if (!memberQ) { return true; }
      var hay = (p.name + ' ' + (p.studentId || '') + ' ' + p.email).toLowerCase();
      return hay.indexOf(memberQ.toLowerCase()) !== -1;
    });

    var assignments = state.activeAssignments(tenant.id).filter(function (a) {
      return a.targetType === 'group' && a.targetId === g.id;
    });

    var memberBody = members.length
      ? '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Members of ' + esc(g.name) + '</caption>' +
        '<thead><tr><th scope="col">Student</th><th scope="col">Course</th>' +
        '<th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
        members.map(function (p) {
          var mem = state.studentCourseMembership(p.id);
          return '<tr><td data-label="Student">' + T.personLink(tenant.id, p) + '</td>' +
            '<td data-label="Course">' + esc(mem && mem.course ? mem.course.name : '—') + '</td>' +
            '<td data-label="Status">' + T.personStatusBadge(p) + '</td>' +
            '<td class="cell-actions">' + T.actionsIfWritable(tenant,
              '<button class="btn sm sec" type="button" data-remove="' + esc(p.id) + '">' +
              'Remove<span class="sr-only"> ' + esc(p.name) + ' from ' + esc(g.name) + '</span></button>', false) +
            '</td></tr>';
        }).join('') + '</tbody></table></div>'
      : ui.emptyState({
          icon: 'users', heading: 'h3', title: 'No members yet',
          body: 'Add students below. An empty group can still be assigned content — the assignment simply reaches nobody until members join.'
        });

    var addBody = !T.canWrite(tenant)
      ? ui.emptyState({
          icon: 'alertCirc', heading: 'h3', title: 'Membership cannot be changed',
          body: 'This institution has been deactivated by the Super Admin. The group and every member are ' +
            'preserved exactly as they are; membership can be changed again once it is reactivated.'
        })
      : !state.studentsForTenant(tenant.id).length
      ? ui.emptyState({
          icon: 'users', heading: 'h3', title: 'No students in this institution',
          body: 'Add or import students before building groups.',
          actionsHTML: T.actionsIfWritable(tenant,
            '<a class="btn pri sm" href="' + T.href.addStudent(tenant.id) + '">Add Student</a>' +
            '<a class="btn sec sm" href="' + T.href.importCsv(tenant.id) + '">Import CSV</a>', false)
        })
      : !candidates.length
        ? ui.emptyState({ icon: 'check', heading: 'h3', title: 'Every student is already a member', body: '' })
        : '<div class="searchbox" style="margin-bottom:12px">' + ui.ic('search') +
          '<label class="sr-only" for="gm-q">Search students to add</label>' +
          '<input type="text" id="gm-q" placeholder="Search students" value="' + esc(memberQ) + '"></div>' +
          (shown.length
            ? '<fieldset class="picklist"><legend class="sr-only">Students to add to ' + esc(g.name) + '</legend>' +
              shown.map(function (p) {
                var mem = state.studentCourseMembership(p.id);
                return '<label class="pick"><input type="checkbox" name="gm" value="' + esc(p.id) + '">' +
                  '<span class="pk-b"><span class="pk-t">' + esc(p.name) + '</span>' +
                  '<span class="pk-s">' + esc(p.studentId || '') +
                  (mem && mem.course ? ' · ' + esc(mem.course.name) : '') +
                  (p.status === 'inactive' ? ' · Inactive' : '') + '</span></span></label>';
              }).join('') + '</fieldset>' +
              '<div class="formact"><button class="btn pri" type="button" id="gm-add">Add selected students</button>' +
              '<span class="formnote">' + shown.length + ' of ' + candidates.length + ' shown</span></div>'
            : ui.emptyState({ icon: 'search', heading: 'h3', title: 'No students match', body: 'Try a different search.' }));

    var asgCard = ui.card('Assignments to this group',
      assignments.length
        ? '<ul class="reqitems">' + assignments.map(function (a) {
            var rec = state.accessById(a.accessId);
            return '<li class="ri"><div class="ri-body">' + T.expLine(a.experimentId) + '</div>' +
              '<div class="ri-tech">' + ui.techBadges(rec ? state.accessTechnologies(rec, a.experimentId) : a.technologies) +
              '</div></li>';
          }).join('') + '</ul>' +
          '<p class="cardfoot">Each of these reaches every <strong>active</strong> member. Adding a member to this group ' +
          'extends the assignment to them — subject to the access record&rsquo;s remaining allocation.</p>'
        : ui.emptyState({
            icon: 'flask', heading: 'h3', title: 'No content assigned to this group',
            body: 'The group exists but reaches no experiment.',
            actionsHTML: (T.canWrite(tenant) && state.assignableAccessForTenant(tenant.id).length)
              ? '<a class="btn pri sm" href="' + T.href.newAssignment(tenant.id) + '">Assign an experiment</a>' : ''
          }),
      null, 'h2');

    var html =
      ui.crumbs([{ label: 'Groups', href: T.href.groups(tenant.id) }, { label: g.name }]) +
      ui.phead(g.name, g.description ? esc(g.description) : members.length + ' ' + util.plural(members.length, 'member'),
        T.actionsIfWritable(tenant, '<button class="btn sec" type="button" id="g-rename">Rename group</button>', false)) +
      '<div class="stack">' +
      ui.card('Members', memberBody, members.length + ' ' + util.plural(members.length, 'member'), 'h2') +
      ui.card('Add students', addBody, null, 'h2') +
      asgCard +
      '</div>';

    return {
      title: g.name, html: html, tenant: tenant, navKey: 'groups',
      after: function () {
        var q = document.getElementById('gm-q');
        if (q) {
          q.addEventListener('input', function () {
            memberQ = q.value;
            XRSLP.render(true);
            var again = document.getElementById('gm-q');
            if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
          });
        }
        var add = document.getElementById('gm-add');
        if (add) {
          add.addEventListener('click', function () {
            var picked = Array.prototype.slice.call(document.querySelectorAll('input[name="gm"]:checked'))
              .map(function (el) { return el.value; });
            if (!picked.length) { ui.toast('Select at least one student to add.', 'info'); return; }
            var n = 0;
            picked.forEach(function (id) { if (state.addToGroup(g.id, id)) { n += 1; } });
            memberQ = '';
            ui.toast(n + ' ' + util.plural(n, 'student') + ' added to ' + g.name + '.');
            XRSLP.render(false);
          });
        }
        Array.prototype.slice.call(document.querySelectorAll('[data-remove]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var pid = btn.getAttribute('data-remove');
            var person = state.personById(pid);
            state.removeFromGroup(g.id, pid);
            ui.toast((person ? person.name : 'Student') + ' removed from ' + g.name + '.');
            XRSLP.render(false);
          });
        });
        var rn = document.getElementById('g-rename');
        if (rn) {
          rn.addEventListener('click', function () {
            ui.openDialog({
              title: 'Rename group',
              bodyHTML:
                '<div class="field"><label for="rn-name">Group name</label>' +
                '<input type="text" id="rn-name" value="' + esc(g.name) + '"></div>' +
                '<div class="field" style="margin-bottom:0"><label for="rn-desc">Description</label>' +
                '<input type="text" id="rn-desc" value="' + esc(g.description) + '"></div>',
              okLabel: 'Save changes',
              onConfirm: function (body) {
                var nameEl = body.querySelector('#rn-name');
                var descEl = body.querySelector('#rn-desc');
                var name = nameEl ? nameEl.value.trim() : '';
                var desc = descEl ? descEl.value.trim() : '';
                if (!name) { ui.toast('A group needs a name — nothing was changed.', 'info'); return; }
                var clash = state.groupByName(tenant.id, name);
                if (clash && clash.id !== g.id) {
                  ui.toast('Another group already uses that name — nothing was changed.', 'info');
                  return;
                }
                state.renameGroup(g.id, name, desc);
                ui.toast('Group updated.');
                XRSLP.render(false);
              }
            });
          });
        }
      }
    };
  };

  /* ============================================================
     ACADEMIC MAPPINGS — local Course Code + OPTIONAL Semester
     ============================================================ */
  XRSLP.screens.tenantMappings = function (params) {
    /* Readable while deactivated — only the Save control is withdrawn. */
    var r = T.requireTenant(params, 'mappings');
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;

    /* The courses this institution actually uses: those reachable
       through live access, plus those its students are placed in. */
    var ids = {}, order = [];
    state.tenantCourseIds(tenant.id).forEach(function (cid) { if (!ids[cid]) { ids[cid] = true; order.push(cid); } });
    state.studentsForTenant(tenant.id).forEach(function (p) {
      if (p.courseId && !ids[p.courseId]) { ids[p.courseId] = true; order.push(p.courseId); }
    });
    order.sort(function (a, b) {
      var ca = data.course(a), cb = data.course(b);
      var na = ca ? ca.name : a, nb = cb ? cb.name : b;
      return na < nb ? -1 : na > nb ? 1 : 0;
    });

    var body;
    if (!order.length) {
      body = ui.emptyState({
        icon: 'doc',
        title: 'No courses to map yet',
        body: 'Local course codes are recorded against the platform Courses this institution actually uses — ' +
          'those inside its approved content access, and those its students are placed in.',
        actionsHTML: '<a class="btn sec" href="' + T.href.access(tenant.id) + '">View content access</a>' +
          '<a class="btn sec" href="' + T.href.people(tenant.id) + '">Open People</a>'
      });
    } else {
      body = '<form id="map-form" novalidate><div class="form-errors"></div>' +
        '<div class="tscroll"><table class="dt maptable">' +
        '<caption class="sr-only">Institution-local mappings for platform courses</caption>' +
        '<thead><tr><th scope="col">Programme</th><th scope="col">Course (canonical)</th>' +
        '<th scope="col">Local course code</th><th scope="col">Semester</th></tr></thead><tbody>' +
        order.map(function (cid, i) {
          var c = data.course(cid);
          var g = c ? data.grouping(c.groupingId) : null;
          var m = state.courseMapping(tenant.id, cid);
          return '<tr>' +
            '<td data-label="Programme">' + esc(g ? g.name : '—') + '</td>' +
            '<td data-label="Course (canonical)"><span class="tmain">' + esc(c ? c.name : cid) + '</span>' +
            '<span class="tsub">Platform-controlled — not editable here</span></td>' +
            '<td data-label="Local course code">' +
            '<label class="sr-only" for="mc-' + i + '">Local course code for ' + esc(c ? c.name : cid) + '</label>' +
            '<input type="text" id="mc-' + i + '" data-course="' + esc(cid) + '" class="cellinput" ' +
            'value="' + esc(m ? m.localCode : '') + '" placeholder="e.g. CE-305"></td>' +
            '<td data-label="Semester">' +
            '<label class="sr-only" for="ms-' + i + '">Semester for ' + esc(c ? c.name : cid) + ' (optional)</label>' +
            '<input type="text" id="ms-' + i + '" data-course-sem="' + esc(cid) + '" class="cellinput sm" ' +
            'value="' + esc(m ? m.semester : '') + '" placeholder="Optional"></td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>' +
        '<div class="formact">' + T.actionsIfWritable(tenant,
          '<button class="btn pri" type="submit" id="map-save">Save mappings</button>', false) +
        '<span class="formnote">Semester is optional and never required. Leaving a field blank clears that mapping.</span>' +
        '</div></form>';
    }

    var html =
      ui.phead('Academic mappings',
        'Institution-local codes recorded beside the platform&rsquo;s canonical Courses.') +
      '<div class="stack">' +
      ui.alertBox('info', 'The platform catalogue is not editable here',
        '<p>Programmes, Courses and Experiments are platform-controlled. An institution records its own course code ' +
        'and, where it uses one, a semester — the canonical Course keeps its name and identity.</p>') +
      '<div class="tablecard">' + body + '</div>' +
      '</div>';

    return {
      title: 'Academic mappings — ' + tenant.name, html: html, tenant: tenant, navKey: 'mappings',
      after: function () {
        var form = document.getElementById('map-form');
        if (!form) { return; }
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var n = 0;
          Array.prototype.slice.call(form.querySelectorAll('[data-course]')).forEach(function (input) {
            var cid = input.getAttribute('data-course');
            var sem = form.querySelector('[data-course-sem="' + cid + '"]');
            var code = input.value.trim();
            var semv = sem ? sem.value.trim() : '';
            var existing = state.courseMapping(tenant.id, cid);
            if (!code && !semv) {
              if (existing) { state.clearCourseMapping(tenant.id, cid); n += 1; }
              return;
            }
            if (!existing || existing.localCode !== code || existing.semester !== semv) {
              state.setCourseMapping(tenant.id, cid, code, semv);
              n += 1;
            }
          });
          ui.toast(n ? n + ' ' + util.plural(n, 'mapping') + ' saved.' : 'No changes to save.',
            n ? undefined : 'info');
          XRSLP.render(false);
        });
      }
    };
  };
})();
