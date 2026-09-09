/* ============================================================
   Unified Functional Platform — Tenant Admin · STUDENT ACCESS.

   Giving a Student or a group access to an approved Experiment
   (STK31-25) and Faculty mapping, both bounded by the tenant's approved
   access (STK31-24).

   An ACCESS GRANT is the ONLY thing in the product that turns
   TENANT ACCESS into STUDENT ENTITLEMENT.

   ── IMPLEMENTATION 07.3 · R04 — WHY THIS IS NO LONGER CALLED AN
      "ASSIGNMENT" ─────────────────────────────────────────────
   The stakeholder rejected the word outright: "what is why are we
   calling it as assignment? … that is not assignment … change this
   terminology, because it will change the complete context." They are
   right, and the reason matters. An ASSIGNMENT is academic work a
   teacher sets a student — a task with a deadline and a mark. What
   happens on this screen is PROVISIONING: an administrator gives a
   student the ability to open content the institution already bought.
   Calling it an assignment made a licensing act look like coursework,
   put the Tenant Admin in a teaching role they do not hold, and
   collided with the Faculty workspace, which is where academic work
   actually lives.

   So, in every user-facing string in this workspace:

       "Assignments"          →  "Student access"
       "an assignment"        →  "an access grant"
       "assign X to Y"        →  "give Y access to X"
       "unassign / remove"    →  "withdraw access"

   FACULTY MAPPING keeps its name: it was already correct, and it is a
   different concept — which content a Faculty member MANAGES, never
   what a student may open.

   ⚠ Routes, `navKey` values, state records and every helper name
   (`assignExperiment`, `previewAssignment`, `draft.accessId`, …) are
   deliberately unchanged. They are internal, several are owned by files
   this one may not edit, and renaming them would be regression risk for
   no user-visible gain.

   ── IMPLEMENTATION 07.3 · R05 — SCALE ────────────────────────
   "If they have to assign 50 experiments, how they will handle it …
    otherwise everything is going to be in a very big dropdown."

   The experiment picker was one flat `<select>` of "Course — Experiment"
   options. It is now grouped by PROGRAMME / DEPARTMENT with `<optgroup>`
   and narrowed by a text filter, and the list of existing grants carries
   its own search and Programme filter. Both use the shared
   `XRSLP.tenantUI.groupContent()` tree, so the picker, the library on
   Content access and the record panels can never organise the same
   content differently.

   Rules enforced here, not merely described:
     · only experiments inside an ACTIVE tenant access record
     · technologies are INHERITED from that record and are not
       selectable — the Tenant Admin neither widens nor narrows them
     · the approved quantity is a hard ceiling on unique active
       students per access record
     · a group that would exceed the remaining allocation is refused
       WHOLE — never partially granted
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

  /* Access-grant builder draft — module-level so the dependent selects
     survive the re-render that keeps them consistent.

     `expQ` (R05) is the CONTENT filter over the experiment picker. It is
     separate from `q`, which filters the STUDENT list further down: one
     shared box would have filtered whichever list the reader was not
     looking at. */
  var draft = { accessId: '', experimentId: '', targetType: 'student', targets: {}, q: '', expQ: '', error: null };
  function resetDraft() {
    draft = { accessId: '', experimentId: '', targetType: 'student', targets: {}, q: '', expQ: '', error: null };
  }
  var showRemoved = false;
  /* R05 — the filter over EXISTING grants. An institution with 50
     experiments and a few hundred students has a grant list far too long
     to read, and it had no filter at all. */
  var listF = { q: '', grouping: 'all', record: 'all' };
  function listIsFiltered() { return !!listF.q || listF.grouping !== 'all' || listF.record !== 'all'; }
  var fmDraft = { personId: '', accessId: '', courseId: '', experimentId: '', q: '' };

  /* ---- CROSS-SCREEN PRESELECTION. These are not routes and the router
     never reaches them; they are the hooks Content access calls on its
     way here so a record-scoped action arrives scoped to that record.

     ⚠ `tenantAssignPrefill` already existed for exactly this and was
     called from nowhere in the build, so both actions on every access
     record panel led to the same two unscoped screens and the builder
     opened blank unless the institution happened to hold exactly one
     usable record. They set VIEW state only: no record is read, nothing
     is granted, and the guards on submission are untouched. */
  XRSLP.screens.tenantAssignPrefill = function (accessId) {
    /* A draft left over from another record — its experiment, its chosen
       students — means nothing here, so it starts clean. */
    resetDraft();
    draft.accessId = accessId || '';
  };
  XRSLP.screens.tenantAssignListPrefill = function (accessId, q) {
    listF = { q: q || '', grouping: 'all', record: accessId || 'all' };
    showRemoved = false;
  };

  function tabs(tenant, active) {
    function t(key, href, label) {
      return '<a class="segi" href="' + href + '"' + (active === key ? ' aria-current="page"' : '') + '>' + esc(label) + '</a>';
    }
    return '<nav class="seg" aria-label="Student access views">' +
      t('students', T.href.assignments(tenant.id), 'Student & group access') +
      t('faculty', T.href.facultyMap(tenant.id), 'Faculty mapping') +
      '</nav>';
  }

  /* ============================================================
     STUDENT ACCESS — the list of existing access grants
     ============================================================ */
  XRSLP.screens.tenantAssignments = function (params) {
    var r = T.requireTenant(params, 'assignments');
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;

    var all = state.assignmentsForTenant(tenant.id).slice().reverse();
    /* ONE source of truth, shared with Overview and Content access. */
    var assignable = state.assignableAccessForTenant(tenant.id);
    var visible = all.filter(function (a) { return showRemoved || a.status === 'active'; });
    var removedCount = all.filter(function (a) { return a.status === 'removed'; }).length;

    /* ---- R05 · filter the grant list ----
       Options come from the grants that actually exist, so no filter is
       offered that can only ever return nothing. */
    var progSeen = {}, progOpts = [], recSeen = {}, recOpts = [];
    all.forEach(function (a) {
      var ctx = data.contextOf(a.experimentId);
      var gid = ctx && ctx.grouping ? ctx.grouping.id : '__none';
      var gname = ctx && ctx.grouping ? ctx.grouping.name : 'Unresolved';
      if (!progSeen[gid]) { progSeen[gid] = true; progOpts.push({ id: gid, name: gname }); }
      /* The option reads as the content it funds, with the reference
         after it — an admin picking a filter should not have to know
         which identifier holds which experiments. */
      if (!recSeen[a.accessId]) {
        recSeen[a.accessId] = true;
        var arec = state.accessById(a.accessId);
        recOpts.push({
          id: a.accessId,
          /* Named by content and term, never by the key — two approvals
             carrying the same Experiment are told apart by the term. */
          name: arec
            ? T.accessContentLine(arec) + ' \u00b7 ' + T.accessTermLine(arec)
            : 'No longer on the platform'
        });
      }
    });
    progOpts.sort(function (x, y) { return x.name < y.name ? -1 : x.name > y.name ? 1 : 0; });
    if (listF.grouping !== 'all' && !progSeen[listF.grouping]) { listF.grouping = 'all'; }
    if (listF.record !== 'all' && !recSeen[listF.record]) { listF.record = 'all'; }

    var list = visible.filter(function (a) {
      var ctx = data.contextOf(a.experimentId);
      if (listF.record !== 'all' && a.accessId !== listF.record) { return false; }
      if (listF.grouping !== 'all') {
        var gid = ctx && ctx.grouping ? ctx.grouping.id : '__none';
        if (gid !== listF.grouping) { return false; }
      }
      if (listF.q) {
        var hay = ((ctx ? ctx.experiment.name + ' ' + ctx.course.name + ' ' + ctx.grouping.name : a.experimentId) +
          ' ' + state.assignmentTargetLabel(a) + ' ' + a.accessId).toLowerCase();
        if (hay.indexOf(listF.q.toLowerCase()) === -1) { return false; }
      }
      return true;
    });

    var body;
    if (!assignable.length && !all.length) {
      /* Never a bare "no access": name every record the institution
         actually holds and say exactly why none can be granted from. */
      body = T.noAssignableAccessHTML(tenant, 'h2');
    } else if (!all.length) {
      body = ui.emptyState({
        icon: 'flask',
        title: 'No student has been given content yet',
        body: 'This institution holds approved content but no student has been given any of it. ' +
          'Holding access and entitling a student are two different things.',
        actionsHTML: T.actionsIfWritable(tenant,
          '<a class="btn pri" href="' + T.href.newAssignment(tenant.id) + '">Give students access</a>', false)
      });
    } else if (!visible.length) {
      /* The "show withdrawn" control is the checkbox in the bar above,
         which is rendered whenever anything has been withdrawn — and in
         this state something always has. A second control here, worded
         and shaped differently, was the same switch twice. */
      body = ui.emptyState({
        icon: 'search', title: 'No active access grants',
        body: 'Every access grant in this institution has been withdrawn. They are kept for traceability — ' +
          'tick “Show withdrawn access grants” above to read them.'
      });
    } else if (!list.length) {
      body = ui.emptyState({
        icon: 'search', title: 'No access grant matches these filters',
        body: 'Nothing in this institution matches the current search and filters. Nothing has been changed.',
        actionsHTML: '<button class="btn sec sm" type="button" id="asg-clear-empty">Clear filters</button>'
      });
    } else {
      body = '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Experiment access grants in ' + esc(tenant.name) + '</caption>' +
        '<thead><tr><th scope="col">Experiment</th><th scope="col">Given to</th>' +
        '<th scope="col">Technologies</th><th scope="col">Students reached</th>' +
        '<th scope="col">Access source / term</th><th scope="col">Status</th>' +
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
            '<td data-label="Given to">' + target + '</td>' +
            '<td data-label="Technologies">' + ui.techBadges(rec ? state.accessTechnologies(rec, a.experimentId) : a.technologies) + '</td>' +
            '<td data-label="Students reached" class="num">' + (a.status === 'active' ? reach : '—') + '</td>' +
            /* ⚠ CONTENT AND TERM FIRST, IDENTIFIER SECOND.
               This cell used to be `ACC-001` in monospace and nothing
               else, which made an institution admin read their own
               student-access list as a table of database keys. What
               they actually need is what kind of access funds this
               grant and when it ends; the reference is kept, exactly
               and unchanged, as the muted line beneath. */
            '<td data-label="Access source / term">' +
            (rec
              /* No technology badges here: this table already carries a
                 Technologies column, and repeating them read as a defect. */
              ? '<span class="tmain">' + esc(T.accessTermLine(rec)) + '</span>' +
                (state.accessIsLive(rec)
                  ? ''
                  : '<span class="tsub">' + esc(state.accessTermState(rec).key === 'expired'
                      ? 'Term ended' : 'Not currently live') + '</span>')
              : '<span class="tmain muted">No longer on the platform</span>') +
            '</td>' +
            '<td data-label="Status">' + (a.status === 'active'
              ? ui.badge('b-success', 'check', 'Active')
              : ui.badge('b-neutral', 'minus', 'Withdrawn ' + util.fmtDate(a.removedAt))) + '</td>' +
            '<td class="cell-actions">' + (a.status === 'active'
              ? T.actionsIfWritable(tenant,
                  '<button class="btn sm sec" type="button" data-unassign="' + esc(a.id) + '">Withdraw' +
                  '<span class="sr-only"> access to this experiment from ' +
                  esc(state.assignmentTargetLabel(a)) + '</span></button>', false)
              : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }

    /* ---- R05 · the filter bar over existing grants ---- */
    function listSelect(id, label, value, options, allLabel) {
      return '<div class="fb-sel"><label class="fb-label" for="' + id + '">' + esc(label) + '</label>' +
        '<select id="' + id + '">' +
        '<option value="all"' + (value === 'all' ? ' selected' : '') + '>' + esc(allLabel) + '</option>' +
        options.map(function (o) {
          return '<option value="' + esc(o.id) + '"' + (value === o.id ? ' selected' : '') + '>' +
            esc(o.name) + '</option>';
        }).join('') + '</select></div>';
    }
    /* Offered as soon as there is more than one grant to tell apart —
       low on purpose, so the correction is reviewable on the seeded
       prototype rather than only at an institution's real scale. */
    var filterBar = (all.length > 1 || listIsFiltered())
      ? '<div class="filterbar">' +
        '<div class="fb-row">' +
        '<div class="fb-search"><label class="fb-label" for="asg-q">Search</label>' +
        '<div class="searchbox">' + ui.ic('search') +
        '<input type="text" id="asg-q" placeholder="Experiment, course, student or group" value="' +
        esc(listF.q) + '"></div></div>' +
        listSelect('asg-prog', 'Programme / department', listF.grouping, progOpts, 'All programmes') +
        /* The filter is by the access that funds a grant, so it is
           labelled by what that means rather than by the record type. */
        listSelect('asg-rec', 'Access source', listF.record, recOpts, 'All access') +
        '</div>' +
        '<div class="fb-foot"><span class="fb-count">' + list.length + ' of ' + visible.length + ' ' +
        util.plural(visible.length, 'access grant') + ' shown</span>' +
        (listIsFiltered() ? '<button class="btn sm sec fb-clear" type="button" id="asg-clear">Clear filters</button>' : '') +
        '</div></div>'
      : '';

    var html =
      ui.phead('Student access',
        'Turning the institution&rsquo;s approved content into student entitlement.',
        (assignable.length && T.canWrite(tenant)
          ? '<a class="btn pri" href="' + T.href.newAssignment(tenant.id) + '">' + ui.ic('plus') +
            'Give students access</a>'
          : null)) +
      tabs(tenant, 'students') +
      /* Records exist but none can be granted from, and grants are
         already on file: explain rather than leave the missing button
         unexplained. */
      (!assignable.length && all.length
        ? '<div style="margin-bottom:16px">' + ui.alertBox('warning', 'No student can be given content right now',
            '<p>' + state.unassignableAccessForTenant(tenant.id).map(function (b) {
              return '<strong>' + esc(b.record.id) + '</strong> — ' + esc(state.assignabilityText(b.reason));
            }).join('; ') + '. Existing access grants below are unchanged.</p>') + '</div>'
        : '') +
      filterBar +
      /* CAPACITY, COMPACT, AND IT DRIVES THE FILTER.
         This used to stack one full allocation meter per assignable
         record above the table the reader came for — the same repetition
         that made Content access long, and with no note explaining the
         counting rule those meters were the only statement of it. One
         line per record now, each with the button that filters the list
         below to exactly that record: `listF.record` was already the
         filter these figures were describing. */
      (assignable.length
        ? '<ul class="reclist" style="margin-bottom:16px">' + assignable.map(function (rec) {
            var alloc = state.accessAllocation(rec.id);
            var on = listF.record === rec.id;
            /* ⚠ WHAT THE ACCESS IS FOR, THEN THE NUMBERS, THEN THE
               REFERENCE. This row led with `ACC-001` in monospace, so
               the first thing on the institution's own access page was
               an identifier that tells nobody anything. It now leads
               with the content and term the record actually funds. */
            return '<li class="recrow' + (on ? '' : ' quiet') + '">' +
              '<div class="rr-b"><div class="rr-t">' +
              '<span>' + esc(T.accessContentLine(rec)) + '</span>' +
              ui.badge('b-outline', null, rec.items.length + ' ' +
                util.plural(rec.items.length, 'experiment')) + '</div>' +
              /* The internal reference is gone from this summary: it is
                 not something a Tenant Admin acts on. Technologies and
                 term are what separate two approvals here. */
              '<div class="rr-m">' + T.allocMetrics(alloc, rec) + '</div>' +
              '<div class="rr-m">' + ui.techBadges(T.recTechnologies(rec)) +
              ' <span class="tsub">' + esc(T.accessTermLine(rec)) + '</span></div></div>' +
              /* The capacity figures are worth showing even before anybody
                 has been given anything; the FILTER is not, so it appears
                 only once there is a list to narrow. */
              (all.length
                ? '<div class="rr-a"><button class="btn sm sec" type="button" data-cap-rec="' + esc(rec.id) + '"' +
                  (on ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' +
                  (on ? 'Showing this access' : 'Show only this access') + '</button></div>'
                : '') + '</li>';
          }).join('') + '</ul>'
        : '') +
      '<div class="tablecard">' +
      (removedCount ? '<div class="listbar">' +
        '<label class="chk"><input type="checkbox" id="asg-removed"' + (showRemoved ? ' checked' : '') + '> ' +
        'Show withdrawn access grants</label>' +
        '<span class="lcount">' + list.length + ' shown · ' + removedCount + ' withdrawn</span></div>' : '') +
      body + '</div>';

    return {
      title: 'Student access — ' + tenant.name, html: html, tenant: tenant, navKey: 'assignments',
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
        /* The capacity rows drive the record filter — the one the select
           in the bar above also drives, so both write the same value. */
        Array.prototype.slice.call(document.querySelectorAll('[data-cap-rec]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-cap-rec');
            listF.record = listF.record === id ? 'all' : id;
            XRSLP.render(true);
            var again = document.querySelector('[data-cap-rec="' + id + '"]');
            if (again) { again.focus(); }
            ui.announce(listF.record === 'all'
              ? 'Showing access grants on every record.'
              : 'Showing access grants on ' + id + ' only.');
          });
        });
        /* R05 — the grant-list filter. Same focus-preserving re-render
           the rest of this workspace uses. */
        var lq = document.getElementById('asg-q');
        if (lq) {
          lq.addEventListener('input', function () {
            listF.q = lq.value;
            XRSLP.render(true);
            var again = document.getElementById('asg-q');
            if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
          });
        }
        [['asg-prog', 'grouping'], ['asg-rec', 'record']].forEach(function (row) {
          var el = document.getElementById(row[0]);
          if (!el) { return; }
          el.addEventListener('change', function () {
            listF[row[1]] = el.value;
            XRSLP.render(true);
            var again = document.getElementById(row[0]);
            if (again) { again.focus(); }
          });
        });
        ['asg-clear', 'asg-clear-empty'].forEach(function (id) {
          var el = document.getElementById(id);
          if (!el) { return; }
          el.addEventListener('click', function () {
            listF = { q: '', grouping: 'all', record: 'all' };
            XRSLP.render(true);
            ui.announce('Filters cleared.');
            var again = document.getElementById('asg-q');
            if (again) { again.focus(); }
          });
        });
        Array.prototype.slice.call(document.querySelectorAll('[data-unassign]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-unassign');
            var a = state.assignmentById(id);
            if (!a) { return; }
            /* Explain exactly what withdrawing this source does —
               including the students who keep the experiment through
               another grant. */
            var keep = state.assignmentReach(a).filter(function (pid) {
              var others = state.entitlementSources(pid, a.accessId, a.experimentId)
                .filter(function (s) { return s.assignmentId !== a.id; });
              var p = state.personById(pid);
              return others.length && p && p.status === 'active';
            }).length;
            var ctx = data.contextOf(a.experimentId);
            ui.openDialog({
              title: 'Withdraw this access?',
              bodyHTML: '<p>Withdraw access to <strong>' + esc(ctx ? ctx.experiment.name : a.experimentId) +
                '</strong> from <strong>' + esc(state.assignmentTargetLabel(a)) + '</strong>?</p>' +
                '<div class="consequence">' + ui.ic('info') + '<span>' +
                (keep ? keep + ' ' + util.plural(keep, 'student') + ' ' + (keep === 1 ? 'keeps' : 'keep') +
                  ' this experiment through another access grant. ' : '') +
                'Every other student reached only by this grant loses the entitlement. ' +
                'The grant itself is retained as history, and no learning record is deleted.</span></div>',
              okLabel: 'Withdraw access',
              onConfirm: function () {
                state.removeAssignment(id);
                ui.toast('Access withdrawn. Entitlement supported by another grant is unchanged.');
                XRSLP.render(false);
              }
            });
          });
        });
      }
    };
  };

  /* ============================================================
     GIVE STUDENTS ACCESS  (internally: the "new assignment" builder)
     ============================================================ */
  XRSLP.screens.tenantNewAssignment = function (params) {
    var r = T.requireTenant(params, 'assignments', { write: true, what: 'Giving a student access' });
    if (!r.tenant) { return r.fail; }
    var tenant = r.tenant;

    var live = state.assignableAccessForTenant(tenant.id);
    if (!live.length) {
      return {
        title: 'Give students access', tenant: tenant, navKey: 'assignments',
        html: ui.crumbs([{ label: 'Student access', href: T.href.assignments(tenant.id) },
            { label: 'Give students access' }]) +
          ui.phead('Give students access') +
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

    /* ---- step 1: which approved content ----
       The stakeholder questioned "access record" as a user-facing term.
       No replacement noun was agreed, so the control asks for the thing
       in plain words and the options carry the business context that
       tells two approvals apart. */
    var step1 =
      '<div class="field" id="na-acc"><label for="na-acc-i">Approved content <span class="req" aria-hidden="true">*</span>' +
      '<span class="sr-only">(required)</span></label>' +
      '<select id="na-acc-i">' +
      '<option value="">Choose approved content…</option>' +
      live.map(function (a) {
        return '<option value="' + esc(a.id) + '"' + (draft.accessId === a.id ? ' selected' : '') + '>' +
          esc(T.accessOptionLabel(a)) + '</option>';
      }).join('') + '</select>' +
      '<p class="hint">Only records the Super Admin has approved and activated for ' + esc(tenant.name) + ' appear here.</p></div>' +
      (alloc ? T.allocMeter(alloc) : '');

    /* ---- step 2: experiment ----
       R05. THIS WAS THE "very big dropdown". A record covering 50
       experiments produced 50 flat "Course — Experiment" options in one
       ungrouped list, and `data.contextOf()` already knew the Programme
       for every one of them — the screen resolved it and threw it away.

       Two changes, and both are needed: `<optgroup>` per PROGRAMME so
       the list has structure, and a text filter over it so the list can
       be made short. Grouping alone still leaves fifty options to
       scroll; filtering alone loses the Programme → Course → Experiment
       shape the institution actually thinks in.

       ⚠ THE FILTER NARROWS THE VIEW, NEVER THE AUTHORITY. It is applied
       to the OPTIONS ONLY. What may be granted still comes from
       `rec.items` — the approved access record — and the state layer
       checks it again on submit. A filtered-out experiment is not
       forbidden, merely not listed, and clearing the box brings it back.

       ⚠ A CHOICE ALREADY MADE IS NEVER FILTERED AWAY. Hiding the
       selected option would leave a select whose value no control on the
       page can see, so the current experiment is always included. */
    var allExpRows = rec ? T.contentRows(rec.items) : [];
    var expRows = allExpRows.filter(function (row) {
      if (row.experimentId === draft.experimentId) { return true; }
      return T.contentMatches(row, { q: draft.expQ });
    });
    /* Offered as soon as there is more than one thing to choose between.
       The threshold is deliberately low rather than "only once it hurts":
       the seeded prototype is small, and a control that appears only at
       fifty experiments cannot be reviewed by the person who asked for
       it. It is still suppressed for a single-experiment record, where
       filtering one option would be a genuinely dead control. */
    var expFilterHTML = (rec && allExpRows.length > 1)
      ? '<div class="field" id="na-expq"><label for="na-expq-i">Filter the experiment list</label>' +
        '<div class="searchbox">' + ui.ic('search') +
        '<input type="text" id="na-expq-i" placeholder="Experiment, course or programme" value="' +
        esc(draft.expQ) + '"></div>' +
        '<p class="hint">' + expRows.length + ' of ' + allExpRows.length + ' approved ' +
        util.plural(allExpRows.length, 'experiment') + ' listed below. Filtering changes what is shown, ' +
        'never what this institution is approved to use.</p></div>'
      : '';

    var step2 = expFilterHTML +
      '<div class="field" id="na-exp"><label for="na-exp-i">Experiment <span class="req" aria-hidden="true">*</span>' +
      '<span class="sr-only">(required)</span></label>' +
      '<select id="na-exp-i"' + (rec ? '' : ' disabled') + '>' +
      (rec
        ? (expRows.length
            ? '<option value="">Select an experiment…</option>' +
              T.experimentOptionsHTML(expRows.map(function (row) { return row.item; }), draft.experimentId)
            : '<option value="">No experiment matches that filter…</option>')
        : '<option value="">Choose approved content first…</option>') +
      '</select>' +
      (rec ? '<p class="hint">Grouped by Programme / department, then Course. Only content inside ' +
        esc(draft.accessId) + ' appears.</p>' : '') +
      '</div>' +
      (draft.experimentId
        ? '<div class="techinherit">' +
          '<div class="ti-k">Technologies granted by ' + esc(draft.accessId) + '</div>' +
          '<div class="ti-v">' + ui.techBadges(techs) + '</div>' +
          '<p class="ti-n">Inherited from the approved content. The institution cannot add a technology it was ' +
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
            body: 'Add or import students before giving anyone content. An inactive student cannot be given access.',
            actionsHTML: '<a class="btn sec sm" href="' + T.href.people(tenant.id) + '">Open People</a>' })
        : '<div class="searchbox" style="margin-bottom:12px">' + ui.ic('search') +
          '<label class="sr-only" for="na-q">Search students</label>' +
          '<input type="text" id="na-q" placeholder="Search students" value="' + esc(draft.q) + '"></div>' +
          (shown.length
            ? '<fieldset class="picklist"><legend class="sr-only">Students to give this experiment to</legend>' +
              shown.map(function (p) {
                var already = rec && draft.experimentId
                  ? state.entitlementSources(p.id, draft.accessId, draft.experimentId) : [];
                var counted = alloc && (alloc.entitledIds.indexOf(p.id) !== -1 || alloc.heldIds.indexOf(p.id) !== -1);
                return '<label class="pick"><input type="checkbox" name="na-target" value="' + esc(p.id) + '"' +
                  (draft.targets[p.id] ? ' checked' : '') + '>' +
                  '<span class="pk-b"><span class="pk-t">' + esc(p.name) + '</span>' +
                  '<span class="pk-s">' + esc(p.studentId || '') +
                  (counted ? ' · already holds a licence on this access' : '') +
                  (already.length ? ' · already entitled via ' +
                    esc(already.map(function (s) { return s.type === 'group' ? s.label : 'a direct grant'; }).join(', ')) : '') +
                  '</span></span></label>';
              }).join('') + '</fieldset>' +
              '<p class="fhint">' + shown.length + ' of ' + activeStudents.length + ' active ' +
              util.plural(activeStudents.length, 'student') + ' shown.</p>'
            : ui.emptyState({ icon: 'search', heading: 'h3', title: 'No students match', body: 'Try a different search.' })) +
          '<p class="cardfoot">Inactive students are not listed: an inactive student cannot be given new access.</p>';
    } else {
      targetList = !groups.length
        ? ui.emptyState({ icon: 'users', heading: 'h3', title: 'No student groups',
            body: 'Create a group first, or give access to individual students instead.',
            actionsHTML: T.actionsIfWritable(tenant,
              '<a class="btn sec sm" href="' + T.href.newGroup(tenant.id) + '">Create group</a>', false) })
        : '<fieldset class="picklist"><legend class="sr-only">Groups to give this experiment to</legend>' +
          groups.map(function (g) {
            var mem = state.membersOfGroup(g.id);
            var act = mem.filter(function (m) { return m.status === 'active'; }).length;
            return '<label class="pick"><input type="checkbox" name="na-target" value="' + esc(g.id) + '"' +
              (draft.targets[g.id] ? ' checked' : '') + '>' +
              '<span class="pk-b"><span class="pk-t">' + esc(g.name) + '</span>' +
              '<span class="pk-s">' + mem.length + ' ' + util.plural(mem.length, 'member') +
              ' · ' + act + ' active</span></span></label>';
          }).join('') + '</fieldset>' +
          '<p class="cardfoot">A group access grant is all-or-nothing. If its new students would exceed the remaining ' +
          'allocation, nobody is given anything — the group is never partially applied.</p>';
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
        lines.push('<li><strong>' + pre.countedStudentIds.length + '</strong> already hold a licence on this access — ' +
          'they consume nothing further.</li>');
      }
      if (pre.alreadyEntitled.length) {
        lines.push('<li><strong>' + pre.alreadyEntitled.length + '</strong> ' +
          util.plural(pre.alreadyEntitled.length, 'student') + ' already entitled to this experiment: ' +
          pre.alreadyEntitled.map(function (x) {
            var p = state.personById(x.personId);
            return esc((p ? p.name : x.personId) + ' — via ' + x.sources.map(function (s) {
              return s.type === 'group' ? s.label : 'a direct grant';
            }).join(', '));
          }).join('; ') + '. They gain another access source, not another entitlement.</li>');
      }
      if (pre.inactiveStudentIds.length) {
        lines.push('<li><strong>' + pre.inactiveStudentIds.length + '</strong> inactive ' +
          util.plural(pre.inactiveStudentIds.length, 'student') + ' would be skipped — an inactive student holds no entitlement.</li>');
      }
      if (pre.duplicateTargets.length) {
        lines.push('<li><strong>' + pre.duplicateTargets.length + '</strong> already have exactly this access and are skipped.</li>');
      }
      if (pre.emptyGroups.length) {
        lines.push('<li>' + pre.emptyGroups.length + ' selected ' + util.plural(pre.emptyGroups.length, 'group') +
          ' currently ' + (pre.emptyGroups.length === 1 ? 'has' : 'have') + ' no members — the access grant would reach nobody yet.</li>');
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
            '<li><span>Students already holding one</span><strong class="tabular">' + pre.alloc.assigned + '</strong></li>' +
            '<li><span>Remaining allocation</span><strong class="tabular">' + pre.alloc.remaining + '</strong></li>' +
            '<li><span>This ' + esc(targetWord) + ' would add</span><strong class="tabular">' + newCount +
              ' new ' + util.plural(newCount, 'student') + '</strong></li>' +
          '</ul>'
        : '';

      var blockText = null;
      if (!pre.ok) {
        blockText =
          pre.reason === 'over-allocation'
            ? 'Blocked — this ' + targetWord + ' requires ' + shortfall + ' more ' +
              util.plural(shortfall, 'licence') + ' on ' + draft.accessId + '. ' +
              'No part of the selection is applied. Free a licence by withdrawing access from somebody or ' +
              'deactivating a student, or ask the Super Admin to revise the approved quantity.'
          : pre.reason === 'duplicate'
            ? 'Blocked — everything selected already has exactly this access.'
          : pre.reason === 'inactive-target'
            ? 'Blocked — every selected student is inactive, and an inactive student cannot be given new access.'
          : pre.reason === 'access-expired'
            ? 'Blocked — this access has expired, so it can no longer entitle anyone.'
          : pre.reason === 'not-assignable'
            ? 'Blocked — nobody can be given content from this access because ' +
              state.assignabilityText(pre.blockedBy) + '.'
          : pre.reason === 'not-approved'
            ? 'Blocked — that experiment is not part of this approved content.'
          : pre.reason === 'other-tenant-target'
            ? 'Blocked — a selected student or group does not belong to this institution.'
            : 'Blocked — this access cannot be given.';
      }

      /* One closing sentence on every blocked attempt: nothing changed. */
      var unchangedText = !pre.ok
        ? 'Nobody has been given anything and remaining allocation stays at ' + pre.alloc.remaining + '.'
        : null;

      consequence = ui.alertBox(pre.ok ? 'info' : 'danger',
        pre.ok ? 'What giving this access will do' : 'This access cannot be given',
        capacityHTML +
        (blockText ? '<p>' + esc(blockText) + '</p>' : '') +
        (unchangedText ? '<p class="capsafe">' + esc(unchangedText) + '</p>' : '') +
        '<ul style="margin:6px 0 0 16px">' + lines.join('') + '</ul>',
        pre.ok ? null : 'alert');
    }

    var canSubmit = pre && pre.ok;

    /* ---- step 3: review and confirm ----
       The submit button used to sit on its own below both cards, under a
       bulleted alert, with nothing restating WHAT was about to be given
       to WHOM. An access grant is irreversible in practice — it is
       withdrawn, never deleted — so the control now sits inside its own
       summary of the choice it commits. Nothing here re-derives anything:
       every figure comes from the same `previewAssignment` the state
       layer checks again on submit. */
    var chosenCtx = draft.experimentId ? data.contextOf(draft.experimentId) : null;
    var targetNames = selected.map(function (id) {
      if (draft.targetType === 'group') {
        var g = state.groupById(id);
        return g ? g.name : id;
      }
      var p = state.personById(id);
      return p ? p.name : id;
    });

    var reviewBody;
    if (!canSubmit && !pre) {
      reviewBody = ui.emptyRow({
        icon: 'circle', heading: 'h3',
        title: 'Nothing to confirm yet',
        body: 'Choose approved content, an experiment, and at least one student or group above.'
      });
    } else {
      reviewBody =
        '<div class="kv compact">' +
        '<div class="k">Approved content</div><div class="v">' +
        esc(T.accessChoiceLabel(state.accessById(draft.accessId))) + '</div>' +
        '<div class="k">Experiment</div><div class="v">' +
        (chosenCtx
          ? esc(chosenCtx.experiment.name) + '<span class="tsub2">' + esc(chosenCtx.grouping.name) + ' › ' +
            esc(chosenCtx.course.name) + '</span>'
          : esc(draft.experimentId)) + '</div>' +
        '<div class="k">Technologies</div><div class="v">' + ui.techBadges(techs) + '</div>' +
        '<div class="k">' + (draft.targetType === 'group' ? 'Groups' : 'Students') + '</div>' +
        '<div class="v">' + esc(targetNames.join(', ')) + '</div>' +
        '</div>' +
        (consequence ? '<div style="margin-top:14px">' + consequence + '</div>' : '');
    }

    var html =
      ui.crumbs([{ label: 'Student access', href: T.href.assignments(tenant.id) },
        { label: 'Give students access' }]) +
      ui.phead('Give students access',
        'Give an approved experiment to individual students or to a group. This is provisioning, not coursework: ' +
        'it decides what a student may <em>open</em>, and sets no task, deadline or mark.') +
      ui.track([
        /* `ui.track` escapes its own text — do not pre-escape here. */
        { t: 'Approved content', d: draft.experimentId ? draft.accessId : 'Record and experiment',
          state: (draft.accessId && draft.experimentId) ? 'done' : 'live' },
        { t: 'Who gets it', d: selected.length
            ? selected.length + ' ' + util.plural(selected.length, draft.targetType === 'group' ? 'group' : 'student') + ' selected'
            : 'Students or groups',
          state: selected.length ? 'done' : (draft.experimentId ? 'live' : 'todo') },
        { t: 'Review and confirm', d: canSubmit ? 'Ready' : pre ? 'Blocked' : 'Not yet',
          state: canSubmit ? 'live' : pre ? 'blocked' : 'todo' }
      ]) +
      '<form id="na-form" novalidate><div class="stack" style="margin-top:16px">' +
      ui.card('1 · Approved content', step1 + step2, null, 'h2') +
      ui.card('2 · Who gets it',
        '<fieldset class="fgroup"><legend>Give access to</legend>' +
        targetRadio('student', 'Individual students', 'Pick one or more students directly.') +
        targetRadio('group', 'Student groups', 'One grant reaching every active member.') +
        '</fieldset>' + targetList, null, 'h2') +
      ui.card('3 · Review and confirm',
        reviewBody +
        '<div class="formact">' +
        '<button class="btn pri" type="submit" id="na-save"' + (canSubmit ? '' : ' disabled aria-disabled="true"') + '>' +
        'Give access</button>' +
        '<a class="btn sec" href="' + T.href.assignments(tenant.id) + '">Cancel</a>' +
        '</div>', null, 'h2') +
      '</div></form>';

    return {
      title: 'Give students access', html: html, tenant: tenant, navKey: 'assignments',
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
            /* A content filter written for the previous record would
               silently hide most of the new one's experiments. */
            draft.expQ = '';
            rerender('na-acc-i');
          });
        }
        /* R05 — the filter over the experiment list. It is a VIEW filter:
           it changes which options are rendered and nothing else. */
        var expQ = document.getElementById('na-expq-i');
        if (expQ) {
          expQ.addEventListener('input', function () {
            draft.expQ = expQ.value;
            rerender('na-expq-i');
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
              ui.announce('This access was not given — nothing has changed.');
              XRSLP.render(false);
              return;
            }
            var ctx = data.contextOf(draft.experimentId);
            var n = result.preview.newStudentIds.length;
            ui.toast('Access to ' + (ctx ? ctx.experiment.name : 'the experiment') + ' given — ' +
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
      fmDraft = { personId: '', accessId: '', courseId: '', experimentId: '', q: '' };
    }
    var frec = fmDraft.accessId ? state.accessById(fmDraft.accessId) : null;
    var courseIds = frec ? state.accessCourseIds(frec) : [];
    if (fmDraft.courseId && courseIds.indexOf(fmDraft.courseId) === -1) { fmDraft.courseId = ''; fmDraft.experimentId = ''; }

    /* R05, completed. The Course select got `<optgroup>`s but not the
       text filter the experiment picker got, so at an institution
       spanning three departments it was still a long grouped list to
       scroll. Same contract as the picker's filter: it narrows the VIEW,
       never the authority — `state.mapFaculty` re-checks the content
       against the access record on submit — and a course already chosen
       is never filtered away, because a select whose value nothing on the
       page can see is worse than a long list. */
    var courseMatches = function (cid) {
      if (!fmDraft.q) { return true; }
      if (cid === fmDraft.courseId) { return true; }
      var c = data.course(cid);
      var g = c ? data.grouping(c.groupingId) : null;
      var hay = ((c ? c.name : cid) + ' ' + (g ? g.name : '') + ' ' + cid).toLowerCase();
      return hay.indexOf(fmDraft.q.toLowerCase()) !== -1;
    };
    var shownCourseIds = courseIds.filter(courseMatches);
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
        '<th scope="col">Approved content</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
        maps.map(function (m) {
          var p = state.personById(m.personId);
          var c = data.course(m.courseId);
          return '<tr>' +
            '<td data-label="Faculty">' + (p ? T.personLink(tenant.id, p) : esc(m.personId)) + '</td>' +
            '<td data-label="Course">' + esc(c ? c.name : m.courseId) + '</td>' +
            '<td data-label="Experiment">' + (m.experimentId ? T.expLine(m.experimentId) :
              '<span class="muted">Whole course context</span>') + '</td>' +
            '<td data-label="Approved content">' +
            (state.accessById(m.accessId)
              ? '<span class="tmain">' + ui.accessTitle(state.accessById(m.accessId)) + '</span>' +
                '<span class="tsub">' + esc(T.accessTermLine(state.accessById(m.accessId))) + '</span>'
              : '<span class="tmain muted">No longer on the platform</span>') + '</td>' +
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
          '<div class="field" id="fm-a"><label for="fm-a-i">Approved content <span class="req" aria-hidden="true">*</span>' +
          '<span class="sr-only">(required)</span></label><select id="fm-a-i">' +
          '<option value="">Choose approved content…</option>' +
          live.map(function (a) {
            return '<option value="' + esc(a.id) + '"' + (fmDraft.accessId === a.id ? ' selected' : '') + '>' +
              esc(T.accessOptionLabel(a)) + '</option>';
          }).join('') + '</select></div>' +
          '</div>' +
          (frec && courseIds.length > 1
            ? '<div class="field" id="fm-q"><label for="fm-q-i">Filter the course list</label>' +
              '<div class="searchbox">' + ui.ic('search') +
              '<input type="text" id="fm-q-i" placeholder="Course or programme" value="' + esc(fmDraft.q) + '"></div>' +
              '<p class="hint">' + shownCourseIds.length + ' of ' + courseIds.length + ' ' +
              util.plural(courseIds.length, 'course') + ' on ' + esc(fmDraft.accessId) + ' listed below. ' +
              'Filtering changes what is shown, never what this institution is approved to use.</p></div>'
            : '') +
          '<div class="frow">' +
          /* R05 — the Course list is grouped by PROGRAMME / DEPARTMENT
             too. A record spanning Civil, Mechanical and Pharmaceutical
             puts every one of their courses in this one control, and an
             ungrouped list of them is the same "very big dropdown" the
             stakeholder objected to on the content picker. The Programme
             is built from the same `data.contextOf()` path the rest of
             this workspace organises content by. */
          '<div class="field" id="fm-c"><label for="fm-c-i">Course <span class="req" aria-hidden="true">*</span>' +
          '<span class="sr-only">(required)</span></label><select id="fm-c-i"' + (frec ? '' : ' disabled') + '>' +
          (frec
            ? (shownCourseIds.length ? '<option value="">Select a course…</option>'
                                     : '<option value="">No course matches that filter…</option>') + (function () {
                var progs = {}, order = [];
                shownCourseIds.forEach(function (cid) {
                  var c = data.course(cid);
                  var g = c ? data.grouping(c.groupingId) : null;
                  var key = g ? g.id : '__none';
                  if (!progs[key]) {
                    progs[key] = { name: g ? g.name : 'Unresolved programme', courses: [] };
                    order.push(progs[key]);
                  }
                  progs[key].courses.push({ id: cid, name: c ? c.name : cid });
                });
                function byName(a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; }
                order.sort(byName);
                return order.map(function (g) {
                  g.courses.sort(byName);
                  return '<optgroup label="' + esc(g.name) + '">' + g.courses.map(function (c) {
                    return '<option value="' + esc(c.id) + '"' +
                      (fmDraft.courseId === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>';
                  }).join('') + '</optgroup>';
                }).join('');
              })()
            : '<option value="">Choose approved content first…</option>') + '</select></div>' +
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
      /* ONE WORDING OF THE LICENCE RULE. It was stated here and again on
         the Faculty person page in different words with different titles,
         which reads as two different rules; both now use the shared
         string in `XRSLP.tenantUI`. It sits in the page meta rather than
         in an alert box, because it is a standing fact about this screen
         rather than something that has just happened. */
      ui.phead('Faculty mapping',
        'Faculty mapped to content inside ' + esc(tenant.name) + '&rsquo;s approved access. ' +
        esc(T.FACULTY_LICENCE_RULE)) +
      tabs(tenant, 'faculty') +
      '<div class="stack">' +
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
        bind('fm-a-i', 'accessId', ['courseId', 'experimentId', 'q']);
        bind('fm-c-i', 'courseId', ['experimentId']);
        bind('fm-e-i', 'experimentId');

        /* The course filter. A view filter, re-rendering the same way
           every other control on this screen does and keeping the caret. */
        var fq = document.getElementById('fm-q-i');
        if (fq) {
          fq.addEventListener('input', function () {
            fmDraft.q = fq.value;
            XRSLP.render(true);
            var again = document.getElementById('fm-q-i');
            if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
          });
        }

        var form = document.getElementById('fm-form');
        if (form) {
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            var errs = [];
            if (!fmDraft.personId) { errs.push({ field: 'fm-p', message: 'Select a Faculty member.' }); }
            if (!fmDraft.accessId) { errs.push({ field: 'fm-a', message: 'Choose approved content.' }); }
            if (!fmDraft.courseId) { errs.push({ field: 'fm-c', message: 'Select a course.' }); }
            if (fmDraft.personId && fmDraft.accessId && fmDraft.courseId &&
                state.facultyMappingExists(tenant.id, fmDraft.personId, fmDraft.accessId, fmDraft.courseId, fmDraft.experimentId || null)) {
              errs.push({ field: 'fm-c', message: 'This Faculty member is already mapped to exactly this content.' });
            }
            if (!ui.showErrors(form, errs, 'Faculty not mapped')) { return; }
            var m = state.mapFaculty(tenant.id, fmDraft.personId, fmDraft.accessId, fmDraft.courseId, fmDraft.experimentId || null);
            if (!m) {
              ui.showErrors(form, [{ field: 'fm-c', message: 'That content is not part of the approved content selected.' }],
                'Faculty not mapped');
              return;
            }
            var p = state.personById(fmDraft.personId);
            fmDraft = { personId: '', accessId: '', courseId: '', experimentId: '', q: '' };
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
