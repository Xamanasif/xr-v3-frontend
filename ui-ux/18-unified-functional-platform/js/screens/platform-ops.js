/* ============================================================
   Unified Functional Platform — SUPER ADMIN workspace (part 3 of 3).

   Role governance · Operations (device transfers · support ·
   access-term expiry).

   ── ROLE GOVERNANCE (STK31-41) ───────────────────────────────
   Super Admin governs Vendor · Academic Reviewer · Content Manager,
   at platform, Course and Experiment granularity, with several people
   permitted on one Experiment. These are PLATFORM roles: no
   institutional person appears on this screen and no institutional
   role can be assigned from here — that stays the Tenant Admin's
   (STK31-25).

   ⚠ THIS IS NOT A DISPLAY. Withdrawing a scope here takes effect in
   the Vendor, Academic Reviewer and Content Manager workspaces
   immediately, because every scope check in the build reads the same
   assignment rows. Nothing in those workspaces holds a second,
   hard-coded scope.

   ── OPERATIONS ───────────────────────────────────────────────
   Device transfer (STK31-38) · support (STK31-39) · the 15-day expiry
   reminder (STK31-28). None of the three touches entitlement: a
   transfer decision, a support resolution and an expiry state all
   leave access records, licence counts and assignments alone.
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
  var P = XRSLP.platformUI;

  /* THE TECHNOLOGIES A DEVICE TRANSFER COVERS.

     A request that named a technology shows it. A request that meant
     "all of them" shows what that resolved to — one badge where the
     Student holds one device-based technology, every badge where they
     hold several. It is NEVER collapsed to a single badge when more than
     one applies: the Super Admin is deciding which authorised device
     binding moves, so the honest answer is the whole set.

     "Not specified" now means only what it says — a record that could
     not be resolved to any device-based technology at all. */
  function transferTechHTML(r, opts) {
    var list = state.transferTechnologies(r);
    if (!list.length) { return '<span class="muted">Not specified</span>'; }
    var badges = list.map(function (t) { return ui.fmtBadge(t); }).join(' ');
    if (!opts || !opts.withNames) { return badges; }
    var names = list.map(function (t) {
      var d = data.TECHNOLOGIES[t];
      return d ? d.name : t;
    }).join(' · ');
    return badges + ' ' + esc(names) +
      (list.length > 1 && state.transferCoversAll(r)
        ? ' <span class="muted">· every device-based technology this student holds</span>'
        : '');
  }

  var ROLE_ORDER = ['vendor', 'reviewer', 'manager'];

  function scopeLabel(m) {
    if (m.scope === state.ROLE_SCOPE.ALL) { return 'Platform-wide'; }
    if (m.scope === state.ROLE_SCOPE.COURSE) {
      var c = data.course(m.courseId);
      return 'Course — ' + (c ? c.name : m.courseId);
    }
    var rec = state.contentRecord(m.experimentId);
    return 'Experiment — ' + (rec ? rec.name : m.experimentId);
  }

  /* ============================================================
     ROLE GOVERNANCE — the registry and the per-content assignments.
     ============================================================ */
  XRSLP.screens.platformRoles = function () {
    var sections = ROLE_ORDER.map(function (role) {
      var actors = state.contentActors(role);
      var rows = actors.map(function (a) {
        var live = state.roleAssignments({ actorId: a.id });
        var scopes = live.length
          ? live.map(function (m) { return ui.badge('b-outline', null, scopeLabel(m)); }).join(' ')
          : '<span class="muted">No scope — this person reaches nothing</span>';
        return '<tr>' +
          '<td data-label="Person"><a class="rowlink" href="' + P.href.actor(a.id) + '">' +
          '<span class="tmain">' + esc(a.name) + '</span>' +
          '<span class="tsub">' + esc(a.organisation) + '</span></a></td>' +
          '<td data-label="Scope">' + scopes + '</td>' +
          '<td data-label="Assignments" class="num">' + live.length + '</td>' +
          '<td class="cell-actions"><a class="btn sm sec" href="' + P.href.actor(a.id) + '">Manage</a></td>' +
          '</tr>';
      }).join('');
      return ui.card(state.contentRoleLabel(role) + 's',
        '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">' + esc(state.contentRoleLabel(role)) + ' role holders and their scope</caption>' +
        '<thead><tr><th scope="col">Person</th><th scope="col">Assigned scope</th>' +
        '<th scope="col">Assignments</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>', null, 'h2');
    }).join('');

    var withoutScope = [];
    ROLE_ORDER.forEach(function (role) {
      state.contentActors(role).forEach(function (a) {
        if (!state.roleAssignments({ actorId: a.id }).length) {
          withoutScope.push({
            tone: 'warn', icon: 'alert',
            title: a.name + ' holds no scope',
            body: 'As a ' + esc(state.contentRoleLabel(role)) + ' with no assignment, this person reaches no ' +
              'content at all. Their completed decisions remain in the record history.',
            href: P.href.actor(a.id), label: 'Assign',
            aria: 'Assign a scope to ' + a.name
          });
        }
      });
    });

    var html =
      ui.phead('Role governance',
        'Vendor · Academic Reviewer · Content Manager — platform roles and what each person reaches') +
      '<div class="stack">' +
      (withoutScope.length
        ? ui.card('Needs attention', P.attentionList(withoutScope), null, 'h2') : '') +
      sections + registerCard() +
      ui.gapNote('IDENTITY ORIGIN STILL NOT DECIDED',
        '<strong><code>QD-02</code> is unchanged and unanswered.</strong> The sources confirm <strong>who ' +
        'assigns</strong> a platform role, not how a person&rsquo;s identity first comes into being; ' +
        'identity-provider role mapping and custom roles are both later-phase, and the standing instruction is to ' +
        '&ldquo;invent no invitation, activation or account-creation mechanism&rdquo;. This surface obeys that ' +
        'literally: registering someone <strong>records a named person</strong> in the platform&rsquo;s own ' +
        'directory and nothing more &mdash; no account, password, credential, invitation, activation or single ' +
        'sign-on is created, and none is implied &mdash; and origin is rendered as a provenance line, exactly as ' +
        'the instruction asks. It is the same treatment the assigned Tenant Admin already receives. Creating a new ' +
        'platform <em>role</em> remains absent: Vendor, Academic Reviewer and Content Manager are the confirmed set.') +
      ui.gapNote('NOT INSTITUTIONAL ROLES',
        'No institutional person appears on this screen and no institutional role can be assigned from it. ' +
        'Faculty and Student records belong to the Tenant Admin, inside a tenant.') +
      '</div>';

    return {
      title: 'Role governance', html: html, navKey: 'roles',
      after: function () { wireRegisterForm(); }
    };
  };

  /* ---------------- registering a platform role holder ----------------

     A person, not an account. The form captures who they are and who
     they act FOR — the Vendor PERSON and the Vendor ORGANISATION are two
     separate fields here because they are two separate things, and
     several people may legitimately share one organisation. Registering
     grants nothing: the new person holds no scope and reaches no content
     until a scope is assigned on their own page. */
  function registerCard() {
    var roleOptions = state.CONTENT_ROLE_ORDER.map(function (r) {
      return '<option value="' + esc(r) + '">' + esc(state.contentRoleLabel(r)) + '</option>';
    }).join('');
    return ui.card('Register a platform role holder',
      '<form id="ac-form" novalidate>' +
      '<div class="form-errors"></div>' +
      '<p class="chelp">Adds a Vendor, Academic Reviewer or Content Manager to the platform directory. ' +
      'They reach <strong>nothing</strong> until you assign them a scope.</p>' +
      '<div class="field" id="ac-role"><label for="ac-role-i">Platform role ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<select id="ac-role-i">' + roleOptions + '</select></div>' +
      '<div class="field" id="ac-name"><label for="ac-name-i">Name ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<input type="text" id="ac-name-i" autocomplete="off"></div>' +
      '<div class="field" id="ac-org"><label for="ac-org-i">Organisation ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<input type="text" id="ac-org-i" autocomplete="off">' +
      '<p class="hint">Who this person acts for. Several people may belong to the same organisation.</p></div>' +
      '<div class="field" id="ac-email"><label for="ac-email-i">Contact email ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<input type="email" id="ac-email-i" autocomplete="off"></div>' +
      '<div class="formact"><button class="btn pri" type="submit">Register role holder</button>' +
      '<span class="formnote">Records a person. No account, credential or invitation is created.</span></div>' +
      '</form>', null, 'h2');
  }

  function wireRegisterForm() {
    var form = document.getElementById('ac-form');
    if (!form) { return; }
    var busy = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) { return; }
      var fields = {
        role: (document.getElementById('ac-role-i') || {}).value || '',
        name: (document.getElementById('ac-name-i') || {}).value || '',
        organisation: (document.getElementById('ac-org-i') || {}).value || '',
        email: (document.getElementById('ac-email-i') || {}).value || ''
      };
      var errs = state.validateContentActor(fields, null);
      if (!ui.showErrors(form, errs, 'Please correct the registration')) { return; }
      busy = true;
      var res = state.registerContentActor(fields);
      if (!res.ok) { busy = false; ui.showErrors(form, res.errors, 'Please correct the registration'); return; }
      ui.toast(res.actor.name + ' is registered. Assign a scope to make work reachable.');
      window.location.hash = P.href.actor(res.actor.id);
    });
  }

  /* ---------------- one role holder ---------------- */
  XRSLP.screens.platformActor = function (params) {
    var actor = state.contentActor(params.actorId);
    if (!actor) {
      return {
        title: 'Role holder not found', navKey: 'roles',
        html: ui.crumbs([{ label: 'Role governance', href: P.href.roles() }, { label: 'Not found' }]) +
          ui.phead('Role holder not found') +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'alertCirc', title: 'Role holder not found',
            body: 'No platform role holder exists with this identifier in the prototype data.',
            actionsHTML: '<a class="btn pri" href="' + P.href.roles() + '">Back to role governance</a>'
          }) + '</div>'
      };
    }

    var all = state.allAssignmentsFor(actor.id);
    var live = all.filter(function (m) { return m.status !== 'removed'; });
    var gone = all.filter(function (m) { return m.status === 'removed'; });
    var allowed = state.roleScopesAllowed(actor.role);

    var liveHTML = live.length
      ? '<ul class="scopelist">' + live.map(function (m) {
          return '<li class="sc"><span class="sc-b">' + ui.ic(
            m.scope === state.ROLE_SCOPE.ALL ? 'shield' : m.scope === state.ROLE_SCOPE.COURSE ? 'book' : 'flask') + '</span>' +
            '<div class="sc-body"><div class="sc-t">' + esc(scopeLabel(m)) + '</div>' +
            '<div class="sc-m">Assigned by ' + esc(m.assignedBy) +
            (m.assignedAt ? ' · ' + esc(util.fmtDate(m.assignedAt)) : '') + '</div></div>' +
            '<button class="btn sm sec" type="button" data-rm-scope="' + esc(m.id) + '">Withdraw</button></li>';
        }).join('') + '</ul>'
      : ui.alertBox('warning', 'No scope assigned',
          '<p>This person holds no live scope, so nothing is actionable for them and no new work can start. ' +
          'Anything they decided in the past stays in the content history, and a Vendor still opens and reads ' +
          'every record they created &mdash; read-only.</p>');

    var goneHTML = gone.length
      ? '<ul class="scopelist muted-list">' + gone.map(function (m) {
          return '<li class="sc off"><span class="sc-b">' + ui.ic('minus') + '</span>' +
            '<div class="sc-body"><div class="sc-t">' + esc(scopeLabel(m)) + '</div>' +
            '<div class="sc-m">Withdrawn ' + esc(util.fmtDate(m.removedAt)) +
            (m.removedReason ? ' — ' + esc(m.removedReason) : '') + '</div></div>' +
            '<button class="btn sm sec" type="button" data-rs-scope="' + esc(m.id) + '">Restore</button></li>';
        }).join('') + '</ul>'
      : '<p class="muted">No scope has been withdrawn from this person.</p>';

    /* ---- the assignment form ---- */
    var scopeOptions = allowed.map(function (s) {
      return '<option value="' + esc(s) + '">' + esc(state.roleScopeLabel(s)) + '</option>';
    }).join('');
    var courseOptions = data.courses().map(function (c) {
      var g = data.grouping(c.groupingId);
      return '<option value="' + esc(c.id) + '">' + esc((g ? g.name + ' — ' : '') + c.name) + '</option>';
    }).join('');
    var expOptions = state.contentRecords().slice().sort(function (a, b) {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    }).map(function (r) {
      var c = data.course(r.courseId);
      return '<option value="' + esc(r.id) + '">' + esc((c ? c.name + ' — ' : '') + r.name) + '</option>';
    }).join('');

    var addCard = ui.card('Assign a scope',
      '<form id="ra-form" novalidate>' +
      '<div class="form-errors"></div>' +
      '<div class="field" id="ra-scope"><label for="ra-scope-i">Scope level ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<select id="ra-scope-i">' + scopeOptions + '</select>' +
      '<p class="hint">' +
      (allowed.indexOf(state.ROLE_SCOPE.ALL) === -1
        ? 'A ' + esc(state.contentRoleLabel(actor.role)) + ' is assigned per Course or per Experiment. ' +
          'Several people may hold the same Experiment.'
        : 'The Content Library is a platform-level surface, so a Content Manager may also hold platform-wide scope.') +
      '</p></div>' +
      '<div class="field" id="ra-course"><label for="ra-course-i">Course</label>' +
      '<select id="ra-course-i">' + courseOptions + '</select></div>' +
      '<div class="field" id="ra-experiment" hidden><label for="ra-experiment-i">Experiment</label>' +
      '<select id="ra-experiment-i">' + expOptions + '</select></div>' +
      '<div class="formact"><button class="btn pri" type="submit">Assign scope</button>' +
      '<span class="formnote">Takes effect immediately in this person&rsquo;s workspace. It grants no tenant ' +
      'anything and consumes no licence.</span></div>' +
      '</form>', null, 'h2');

    /* ---- what this person actually reaches, right now ---- */
    var reachable = state.contentRecords().filter(function (r) {
      return state.actorCoversRecord(actor.id, r);
    });
    var historic = state.actorHistoricalRecordIds(actor.id);
    var outOfScopeHistory = historic.filter(function (id) {
      return !reachable.some(function (r) { return r.id === id; });
    });

    var reachCard = ui.card('What this person reaches now',
      reachable.length
        ? '<ul class="reslist plain">' + reachable.map(function (r) {
            return '<li>' + ui.ic('flask') + '<span><strong>' + esc(r.name) + '</strong> ' +
              '<span class="muted">· ' + esc(state.contentStatusMeta(r.status).label) + '</span></span></li>';
          }).join('') + '</ul>'
        : '<p class="muted">Nothing. With no scope, this workspace shows no actionable work.</p>',
      null, 'h2');

    var historyCard = ui.card('Decisions already taken',
      historic.length
        ? '<ul class="reslist plain">' + historic.map(function (id) {
            var r = state.contentRecord(id);
            var out = outOfScopeHistory.indexOf(id) !== -1;
            return '<li>' + ui.ic('doc') + '<span>' + esc(r ? r.name : id) +
              (out ? ' <span class="muted">· now outside this person&rsquo;s scope — the history is kept</span>' : '') +
              '</span></li>';
          }).join('') + '</ul>' +
          '<p class="cardfoot">Withdrawing a scope <strong>freezes</strong>, it never deletes. A completed ' +
          'academic decision, a submission, a publication and every history entry stay exactly as they were made, ' +
          'with this person&rsquo;s name on them, and a Vendor keeps sight of every record they created — ' +
          'read-only. What is withdrawn is the authority to change or move that work, and it returns in full ' +
          'if the scope is restored.</p>'
        : '<p class="muted">This person has not acted on any content record yet.</p>', null, 'h2');

    var html =
      ui.crumbs([{ label: 'Role governance', href: P.href.roles() }, { label: actor.name }]) +
      ui.phead(actor.name, esc(state.contentRoleLabel(actor.role)) + ' · ' + esc(actor.organisation)) +
      '<div class="grid-rail">' +
      '<div class="stack">' +
      ui.card('Assigned scope', liveHTML +
        '<h3 class="vh">Withdrawn</h3>' + goneHTML, null, 'h2') +
      addCard + '</div>' +
      '<div class="stack">' +
      ui.card('Identity',
        '<div class="kv">' +
        '<div class="k">Name</div><div class="v">' + esc(actor.name) + '</div>' +
        '<div class="k">Platform role</div><div class="v">' + esc(state.contentRoleLabel(actor.role)) + '</div>' +
        '<div class="k">Organisation</div><div class="v">' + esc(actor.organisation) + '</div>' +
        '<div class="k">Contact</div><div class="v">' + esc(actor.email) + '</div>' +
        '<div class="k">Origin</div><div class="v">' +
        esc(actor.source === 'seed' ? 'Prototype sample identity' : 'Recorded on the platform') + '</div>' +
        '</div>' +
        '<p class="cardfoot">' +
        (actor.source === 'seed'
          ? 'A sample identity, not a real person. No account, credential or invitation exists behind it.'
          : 'Recorded on this platform by the Super Admin. It names a person and nothing more &mdash; there is ' +
            'no account, password, credential, invitation, activation or single sign-on behind it, and none is ' +
            'implied. How an identity first comes into being is still undecided (<code>QD-02</code>).') +
        '</p>', null, 'h2') +
      reachCard + historyCard +
      '</div></div>';

    return {
      title: actor.name, html: html, navKey: 'roles',
      after: function () {
        var sel = document.getElementById('ra-scope-i');
        var courseField = document.getElementById('ra-course');
        var expField = document.getElementById('ra-experiment');
        function sync() {
          if (!sel) { return; }
          var v = sel.value;
          if (courseField) { courseField.hidden = v !== state.ROLE_SCOPE.COURSE; }
          if (expField) { expField.hidden = v !== state.ROLE_SCOPE.EXPERIMENT; }
        }
        if (sel) { sel.addEventListener('change', sync); }
        sync();

        var form = document.getElementById('ra-form');
        if (form) {
          var busy = false;
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (busy) { return; }
            var fields = {
              actorId: actor.id,
              role: actor.role,
              scope: (document.getElementById('ra-scope-i') || {}).value || '',
              courseId: (document.getElementById('ra-course-i') || {}).value || '',
              experimentId: (document.getElementById('ra-experiment-i') || {}).value || ''
            };
            var errs = state.validateRoleAssignment(fields);
            if (!ui.showErrors(form, errs, 'Please correct the assignment')) { return; }
            busy = true;
            var res = state.assignPlatformRole(fields);
            if (!res.ok) { busy = false; ui.showErrors(form, res.errors, 'Please correct the assignment'); return; }
            ui.toast(actor.name + ' now holds ' + scopeLabel(res.assignment) + '.');
            XRSLP.render(false);
          });
        }

        Array.prototype.slice.call(document.querySelectorAll('[data-rm-scope]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-rm-scope');
            var m = state.roleAssignmentById(id);
            if (!m) { return; }
            ui.openDialog({
              title: 'Withdraw ' + scopeLabel(m) + '?',
              bodyHTML:
                '<p><strong>' + esc(actor.name) + '</strong> stops receiving new work under this scope ' +
                'immediately, in their own workspace &mdash; and every record they already hold under it ' +
                'becomes <strong>read-only</strong> to them: no editing, no submitting or resubmitting, no ' +
                'change of Course, technology, package or metadata.</p>' +
                '<div class="consequence">' + ui.ic('info') + '<span>Nothing is deleted and nothing is ' +
                'hidden. Completed academic decisions, submissions, publications and history entries stay ' +
                'exactly as they were made, a Vendor can still open and read their own work, and the scope ' +
                'is recorded as withdrawn and can be restored &mdash; which returns the authority in ' +
                'full.</span></div>' +
                '<div class="field" id="ra-reason" style="margin-top:12px">' +
                '<label for="ra-reason-i">Reason (recorded against the withdrawn scope)</label>' +
                '<input type="text" id="ra-reason-i" autocomplete="off"></div>',
              okLabel: 'Withdraw scope',
              onConfirm: function (body) {
                var input = body ? body.querySelector('#ra-reason-i') : null;
                state.removePlatformRoleAssignment(id, input ? input.value : '');
                ui.toast('Scope withdrawn. Work already held under it becomes read-only; nothing is deleted.');
                XRSLP.render(false);
              }
            });
          });
        });
        Array.prototype.slice.call(document.querySelectorAll('[data-rs-scope]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-rs-scope');
            var out = state.restorePlatformRoleAssignment(id);
            ui.toast(out ? 'Scope restored. Editing, submission and new work return to this workspace.'
                         : 'That scope is already held.');
            XRSLP.render(false);
          });
        });
      }
    };
  };

  /* ============================================================
     OPERATIONS — device transfers · support · expiry attention.
     ============================================================ */
  XRSLP.screens.platformOperations = function () {
    var transfers = state.deviceTransferRequests().slice().sort(function (a, b) { return (b.seq || 0) - (a.seq || 0); });
    var openTransfers = transfers.filter(function (r) { return r.status === state.TRANSFER_STATUS.SUBMITTED; });
    var tickets = state.supportTickets().slice().sort(function (a, b) { return (b.seq || 0) - (a.seq || 0); });
    var openTickets = tickets.filter(function (t) { return t.status === state.SUPPORT_STATUS.OPEN; });
    var reminders = state.accessNeedingExpiryReminder();
    var expired = state.accessAll().filter(function (rec) { return !state.accessIsLive(rec); });

    /* ---- device transfers ---- */
    var transferBody = transfers.length
      ? '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Device replacement and transfer requests</caption>' +
        '<thead><tr><th scope="col">Request</th><th scope="col">Student</th><th scope="col">Institution</th>' +
        '<th scope="col">Technology</th><th scope="col">Status</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
        transfers.map(function (r) {
          var t = state.tenantById(r.tenantId);
          var m = state.transferStatusMeta(r.status);
          /* `def` is no longer the source of the technology cell — see
             `transferTechHTML`. */
          return '<tr>' +
            '<td data-label="Request"><a class="rowlink" href="' + P.href.transfer(r.id) + '">' +
            '<span class="tmain">' + esc(r.id) + '</span>' +
            '<span class="tsub">' + esc(util.fmtDate(r.createdAt)) + '</span></a></td>' +
            '<td data-label="Student">' + esc(r.personName) + '</td>' +
            '<td data-label="Institution">' + esc(t ? t.name : r.tenantId) + '</td>' +
            '<td data-label="Technology">' + transferTechHTML(r) + '</td>' +
            '<td data-label="Status">' + ui.badge(m.badge, m.icon, m.label) + '</td>' +
            '<td class="cell-actions"><a class="btn sm ' +
            (r.status === state.TRANSFER_STATUS.SUBMITTED ? 'pri' : 'sec') + '" href="' + P.href.transfer(r.id) + '">' +
            (r.status === state.TRANSFER_STATUS.SUBMITTED ? 'Review' : 'Open') + '</a></td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>'
      : ui.emptyState({
          icon: 'monitor', heading: 'h3',
          title: 'No device requests',
          body: 'A student who needs the authorised package moved to a replacement device raises the request ' +
            'from their own workspace. It appears here for a decision.'
        });

    /* ---- support ---- */
    var supportBody = tickets.length
      ? '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Reported technical issues</caption>' +
        '<thead><tr><th scope="col">Report</th><th scope="col">Issue</th><th scope="col">Reported by</th>' +
        '<th scope="col">Institution</th><th scope="col">Status</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
        tickets.map(function (t) {
          var ten = t.tenantId ? state.tenantById(t.tenantId) : null;
          var m = state.supportStatusMeta(t.status);
          return '<tr>' +
            '<td data-label="Report"><a class="rowlink" href="' + P.href.ticket(t.id) + '">' +
            '<span class="tmain">' + esc(t.id) + '</span>' +
            '<span class="tsub">' + esc(util.fmtDate(t.createdAt)) + '</span></a></td>' +
            '<td data-label="Issue"><span class="tmain" style="font-weight:500">' + esc(t.subject) + '</span>' +
            '<span class="tsub">' + esc(state.supportCategoryLabel(t.category)) + '</span></td>' +
            '<td data-label="Reported by">' + esc(t.requesterName) +
            '<span class="tsub">' + esc(t.requesterRoleLabel) + '</span></td>' +
            '<td data-label="Institution">' + esc(ten ? ten.name : '—') + '</td>' +
            '<td data-label="Status">' + ui.badge(m.badge, m.icon, m.label) + '</td>' +
            '<td class="cell-actions"><a class="btn sm ' +
            (t.status === state.SUPPORT_STATUS.OPEN ? 'pri' : 'sec') + '" href="' + P.href.ticket(t.id) + '">' +
            (t.status === state.SUPPORT_STATUS.OPEN ? 'Resolve' : 'Open') + '</a></td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>'
      : ui.emptyState({
          icon: 'check', heading: 'h3',
          title: 'No issues reported',
          body: 'Students, Faculty, Tenant Admins and the content roles report technical issues from the Help ' +
            'destination in their own workspace. Reports appear here.'
        });

    /* ---- expiry ---- */
    var expiryBody = (reminders.length || expired.length)
      ? '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Access terms needing attention</caption>' +
        '<thead><tr><th scope="col">Access record</th><th scope="col">Institution</th>' +
        '<th scope="col">Term ends</th><th scope="col">Remaining</th><th scope="col">State</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
        reminders.concat(expired).map(function (rec) {
          var t = state.tenantById(rec.tenantId);
          var days = state.accessDaysUntilExpiry(rec);
          var live = state.accessIsLive(rec);
          return '<tr>' +
            '<td data-label="Access record"><span class="tmain">' + esc(rec.id) + '</span>' +
            '<span class="tsub">' + rec.items.length + ' ' + util.plural(rec.items.length, 'experiment') +
            ' · ' + rec.quantity + ' ' + util.plural(rec.quantity, 'user') + '</span></td>' +
            '<td data-label="Institution">' + esc(t ? t.name : rec.tenantId) + '</td>' +
            '<td data-label="Term ends">' + esc(util.fmtDate(rec.endsOn)) + '</td>' +
            '<td data-label="Remaining" class="num">' + (live && days != null ? days + ' ' + util.plural(days, 'day') : '—') + '</td>' +
            '<td data-label="State">' + (live
              ? ui.badge('b-warning', 'clock', 'Reminder due')
              : ui.badge('b-danger', 'alertCirc', 'Expired')) + '</td>' +
            '<td class="cell-actions"><a class="btn sm sec" href="' + P.href.institution(rec.tenantId) + '">Institution</a></td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>'
      : ui.emptyState({
          icon: 'check', heading: 'h3',
          title: 'No access term needs attention',
          body: 'No institutional access term ends within the next 15 days, and none has expired.'
        });

    /* ⚠ PROTOTYPE-ONLY. The 15-day reminder is a confirmed requirement
       (STK31-28), but no product action can reach the state: the
       shortest access term a request can carry is Monthly, so every
       activated record starts about thirty days out. Without this, the
       confirmed rule could be asserted in the test suite and never seen
       in a walkthrough. It moves one record's end date and nothing else
       — no quantity, no item, no assignment, no entitlement — and there
       is no product control that does this. */
    var liveRecords = state.accessAll().filter(state.accessIsLive);
    var expiryDemo = liveRecords.length
      ? ui.protoNote(
          '<p><strong>The reminder state cannot be reached by using the product.</strong> The shortest access ' +
          'term is Monthly, so a freshly activated record is about thirty days from its end date. To see the ' +
          'confirmed 15-day rule on a real record, move one record&rsquo;s end date below — the equivalent of ' +
          'winding the demo clock forward. It grants nothing, renews nothing, and changes no quantity, ' +
          'assignment or licence allocation.</p>' +
          '<p><strong>It is a date change, so it has a date change&rsquo;s consequences.</strong> Moving a record ' +
          'past its end date expires it, and entitlement derived from an expired record stops being effective — ' +
          'exactly as it would on the day the term really ended. Nothing is deleted, and moving the date back ' +
          'restores it.</p>',
          '<label for="xp-rec" style="font-weight:600;margin-right:6px">Access record</label> ' +
          '<select id="xp-rec">' + liveRecords.map(function (rec) {
            var t = state.tenantById(rec.tenantId);
            return '<option value="' + esc(rec.id) + '">' + esc(rec.id + ' — ' + (t ? t.name : rec.tenantId)) +
              '</option>';
          }).join('') + '</select> ' +
          '<label for="xp-days" style="font-weight:600;margin:0 6px 0 14px">Ends in</label> ' +
          '<select id="xp-days">' +
          '<option value="16">16 days (not due)</option>' +
          '<option value="15" selected>15 days (reminder due)</option>' +
          '<option value="10">10 days (reminder due)</option>' +
          '<option value="-1">already ended (expired)</option>' +
          '</select> ' +
          '<button class="btn sec sm" type="button" id="xp-go">Move the end date</button>')
      : '';

    var html =
      ui.phead('Operations',
        (function () {
          var n = openTransfers.length + openTickets.length + reminders.length;
          return n ? n + ' ' + util.plural(n, 'item') + ' ' + (n === 1 ? 'needs' : 'need') + ' attention'
                   : 'Device transfers, support reports and access-term expiry';
        })()) +
      '<div class="stack">' +
      ui.card('Device replacement and transfer', transferBody +
        '<p class="cardfoot">A decision here moves the authorised device binding and nothing else. It consumes ' +
        'no licence, grants no experiment, adds no technology, and changes no assessment state. ' +
        'There is no device registry anywhere in the platform, so no hardware is registered, certified or ' +
        'configured — the request records what the student told us.</p>', null, 'h2') +
      ui.card('Support reports', supportBody +
        '<p class="cardfoot">No response time is promised, no priority is assigned, no external ticketing ' +
        'provider is integrated, and no notification is sent to anybody. The reporter sees the state in ' +
        'their own workspace.</p>', null, 'h2') +
      ui.card('Access terms and the 15-day reminder', expiryBody + expiryDemo, null, 'h2') +
      P.reminderNote() +
      '</div>';

    return {
      title: 'Operations', html: html, navKey: 'operations',
      after: function () {
        var go = document.getElementById('xp-go');
        if (!go) { return; }
        go.addEventListener('click', function () {
          var recSel = document.getElementById('xp-rec');
          var daySel = document.getElementById('xp-days');
          if (!recSel || !daySel) { return; }
          var out = state.protoSetAccessEnd(recSel.value, Number(daySel.value));
          if (out) {
            ui.toast('Prototype only — ' + out.id + ' now ends ' + util.fmtDate(out.endsOn) +
              (state.accessIsLive(out)
                ? '. No entitlement, licence or assignment changed.'
                : '. The record is now expired, so entitlement derived from it is no longer effective — ' +
                  'nothing was deleted.'));
          }
          XRSLP.render(false);
        });
      }
    };
  };

  /* ---------------- device transfer detail ---------------- */
  XRSLP.screens.platformTransfer = function (params) {
    var r = state.deviceTransferById(params.id);
    if (!r) {
      return {
        title: 'Request not found', navKey: 'operations',
        html: ui.crumbs([{ label: 'Operations', href: P.href.operations() }, { label: 'Not found' }]) +
          ui.phead('Device request not found') +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'alertCirc', title: 'Device request not found',
            body: 'No device replacement request exists with this identifier in the prototype data.',
            actionsHTML: '<a class="btn pri" href="' + P.href.operations() + '">Back to operations</a>'
          }) + '</div>'
      };
    }
    var tenant = state.tenantById(r.tenantId);
    var person = state.personById(r.personId);
    var m = state.transferStatusMeta(r.status);
    var open = r.status === state.TRANSFER_STATUS.SUBMITTED;

    var entitled = person ? state.studentExperiments(person.id).filter(function (row) { return row.effective; }) : [];

    var decisionHTML = open
      ? '<div class="decidebar">' +
        '<span class="db-note">Approving moves the authorised device binding to the replacement device. ' +
        'It consumes no licence, grants no experiment, adds no technology and changes no assessment state.</span>' +
        '<button class="btn sec" type="button" id="dt-decline">Decline</button>' +
        '<button class="btn pri" type="button" id="dt-approve">' + ui.ic('check') + 'Approve transfer</button>' +
        '</div>'
      : '<div class="decidebar"><span class="db-note">' +
        (r.status === state.TRANSFER_STATUS.APPROVED
          ? 'Approved ' + esc(util.fmtDateTime(r.decidedAt)) + '. The student can see this outcome in their workspace.'
          : 'Declined ' + esc(util.fmtDateTime(r.decidedAt)) + '. The student can see this outcome and the reason.') +
        '</span></div>';

    var timeline = '<div class="timeline">' + r.history.map(function (h) {
      var cls = h.kind === 'approved' ? 'good' : h.kind === 'declined' ? 'warn' : 'info';
      return '<div class="tl-item"><span class="tl-dot ' + cls + '">' +
        ui.ic(h.kind === 'approved' ? 'check' : h.kind === 'declined' ? 'x' : 'monitor') + '</span>' +
        '<div class="tl-body"><div class="tl-action">' + esc(h.label) + '</div>' +
        '<div class="tl-who">' + esc(h.who) + ' · ' + esc(util.fmtDateTime(h.at)) + '</div>' +
        (h.note ? '<p class="tl-note">' + esc(h.note) + '</p>' : '') +
        '</div></div>';
    }).join('') + '</div>';

    var html =
      ui.crumbs([{ label: 'Operations', href: P.href.operations() }, { label: r.id }]) +
      ui.phead('Device request ' + r.id,
        esc(r.personName) + (tenant ? ' · ' + esc(tenant.name) : ''),
        null, ' ' + ui.badge(m.badge, m.icon, m.label)) +
      '<div class="grid-rail">' +
      '<div class="stack">' +
      '<section class="card"><div class="chead"><h2>What was requested</h2></div>' +
      '<div class="cbody"><div class="kv">' +
      '<div class="k">Student</div><div class="v">' + esc(r.personName) +
      (person ? ' <span class="muted">· ' + esc(person.studentId || person.email) + '</span>' : '') + '</div>' +
      '<div class="k">Institution</div><div class="v">' + esc(tenant ? tenant.name : r.tenantId) + '</div>' +
      '<div class="k">Technology</div><div class="v">' +
      transferTechHTML(r, { withNames: true }) + '</div>' +
      '<div class="k">Current device</div><div class="v">' + esc(r.currentDevice) + '</div>' +
      '<div class="k">Replacement device</div><div class="v">' + esc(r.newDevice) + '</div>' +
      '<div class="k">Reason given</div><div class="v">' + esc(r.reason) + '</div>' +
      '<div class="k">Requested</div><div class="v">' + esc(util.fmtDateTime(r.createdAt)) + '</div>' +
      (r.decisionNote ? '<div class="k">Decision note</div><div class="v">' + esc(r.decisionNote) + '</div>' : '') +
      '</div>' + decisionHTML + '</div></section>' +
      '</div>' +
      '<div class="stack">' +
      ui.card('The student&rsquo;s entitlement — unchanged by this decision',
        entitled.length
          ? '<ul class="reslist plain">' + entitled.map(function (row) {
              var ctx = data.contextOf(row.experimentId);
              return '<li>' + ui.ic('flask') + '<span>' + esc(ctx ? ctx.experiment.name : row.experimentId) +
                ' <span class="muted">· ' + ui.techBadges(row.technologies) + '</span></span></li>';
            }).join('') + '</ul>'
          : '<p class="muted">This student holds no effective entitlement at the moment.</p>',
        null, 'h2') +
      ui.card('History', timeline) +
      ui.gapNote('NO DEVICE REGISTRY',
        'The platform holds a device <em>transfer approval</em> with no device <em>registry</em> behind it — the ' +
        'binding is a relationship, not an administrable record. Nothing here registers hardware, names a model, ' +
        'or certifies compatibility. Device registration and remote configuration are later-phase.') +
      ui.gapNote('IMPLEMENTATION JUDGEMENT',
        'The requirement contains <strong>no rejection behaviour</strong>: the confirmed flow is request → ' +
        'approve. The Decline path is an implementation decision taken for this build so a request cannot sit ' +
        'open forever, and it is recorded as a judgement call rather than a confirmed capability.') +
      '</div></div>';

    return {
      title: 'Device request ' + r.id, html: html, navKey: 'operations',
      after: function () {
        var ap = document.getElementById('dt-approve');
        if (ap) {
          ap.addEventListener('click', function () {
            ui.openDialog({
              title: 'Approve device transfer ' + r.id + '?',
              bodyHTML:
                '<p>The authorised device binding for <strong>' + esc(r.personName) + '</strong> moves to ' +
                '<strong>' + esc(r.newDevice) + '</strong>.</p>' +
                '<div class="consequence">' + ui.ic('shield') + '<span>This consumes <strong>no licence</strong>, ' +
                'grants <strong>no experiment</strong>, adds <strong>no technology</strong> and changes ' +
                '<strong>no assessment state</strong>. The student&rsquo;s entitlement is exactly what it was ' +
                'before.</span></div>' +
                '<div class="field" id="dt-note" style="margin-top:12px">' +
                '<label for="dt-note-i">Note to the student (optional)</label>' +
                '<input type="text" id="dt-note-i" autocomplete="off"></div>',
              okLabel: 'Approve transfer',
              onConfirm: function (body) {
                var input = body ? body.querySelector('#dt-note-i') : null;
                state.decideDeviceTransfer(r.id, state.TRANSFER_STATUS.APPROVED, input ? input.value : '');
                ui.toast('Device transfer ' + r.id + ' approved. No licence or entitlement changed.');
                XRSLP.render(false);
              }
            });
          });
        }
        var dec = document.getElementById('dt-decline');
        if (dec) {
          dec.addEventListener('click', function () {
            ui.openDialog({
              title: 'Decline device transfer ' + r.id + '?',
              bodyHTML:
                '<p>The student keeps their current device binding and sees the reason you record here.</p>' +
                '<div class="consequence">' + ui.ic('info') + '<span>Declining changes nothing about their ' +
                'entitlement either. They can raise a new request afterwards.</span></div>' +
                '<div class="field" id="dt-dnote" style="margin-top:12px">' +
                '<label for="dt-dnote-i">Reason (shown to the student) ' +
                '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
                '<input type="text" id="dt-dnote-i" autocomplete="off"></div>',
              okLabel: 'Decline request',
              onConfirm: function (body) {
                var input = body ? body.querySelector('#dt-dnote-i') : null;
                var note = input ? input.value : '';
                var out = state.decideDeviceTransfer(r.id, state.TRANSFER_STATUS.DECLINED, note);
                if (!out) {
                  /* The student is shown the reason, so there has to be one.
                     Nothing was written; say so and leave the request open. */
                  ui.toast('Nothing was changed — a reason is required to decline a request.', 'info');
                  ui.announce('The request was not declined. A reason is required.');
                  return;
                }
                ui.toast('Device transfer ' + r.id + ' declined.');
                XRSLP.render(false);
              }
            });
          });
        }
      }
    };
  };

  /* ---------------- support ticket detail ---------------- */
  XRSLP.screens.platformTicket = function (params) {
    var t = state.supportTicketById(params.id);
    if (!t) {
      return {
        title: 'Report not found', navKey: 'operations',
        html: ui.crumbs([{ label: 'Operations', href: P.href.operations() }, { label: 'Not found' }]) +
          ui.phead('Support report not found') +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'alertCirc', title: 'Support report not found',
            body: 'No support report exists with this identifier in the prototype data.',
            actionsHTML: '<a class="btn pri" href="' + P.href.operations() + '">Back to operations</a>'
          }) + '</div>'
      };
    }
    var tenant = t.tenantId ? state.tenantById(t.tenantId) : null;
    var m = state.supportStatusMeta(t.status);
    var ctx = t.experimentId ? data.contextOf(t.experimentId) : null;
    var def = t.technology ? data.TECHNOLOGIES[t.technology] : null;
    var open = t.status === state.SUPPORT_STATUS.OPEN;

    var decisionHTML = open
      ? '<form id="sr-form" novalidate>' +
        '<div class="form-errors"></div>' +
        '<div class="field" id="sr-note"><label for="sr-note-i">What was done ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<textarea id="sr-note-i" rows="3"></textarea>' +
        '<p class="hint">The reporter sees this note on their own Help page. No message is sent to them.</p></div>' +
        '<div class="formact"><button class="btn pri" type="submit">' + ui.ic('check') + 'Resolve report</button>' +
        '<span class="formnote">Resolving this report changes nothing else: no entitlement, no licence, ' +
        'no assignment and no content state.</span></div>' +
        '</form>'
      : '<div class="decidebar"><span class="db-note">Resolved ' + esc(util.fmtDateTime(t.resolvedAt)) +
        '. The reporter can see the outcome on their own Help page.</span>' +
        '<button class="btn sec" type="button" id="sr-reopen">Reopen</button></div>';

    var timeline = '<div class="timeline">' + t.history.map(function (h) {
      var cls = h.kind === 'resolved' ? 'good' : h.kind === 'reopened' ? 'warn' : 'info';
      return '<div class="tl-item"><span class="tl-dot ' + cls + '">' +
        ui.ic(h.kind === 'resolved' ? 'check' : h.kind === 'reopened' ? 'alert' : 'doc') + '</span>' +
        '<div class="tl-body"><div class="tl-action">' + esc(h.label) + '</div>' +
        '<div class="tl-who">' + esc(h.who) + ' · ' + esc(util.fmtDateTime(h.at)) + '</div>' +
        (h.note ? '<p class="tl-note">' + esc(h.note) + '</p>' : '') +
        '</div></div>';
    }).join('') + '</div>';

    var html =
      ui.crumbs([{ label: 'Operations', href: P.href.operations() }, { label: t.id }]) +
      ui.phead(t.subject, esc(t.id) + ' · reported ' + esc(util.fmtDateTime(t.createdAt)),
        null, ' ' + ui.badge(m.badge, m.icon, m.label)) +
      '<div class="grid-rail">' +
      '<div class="stack">' +
      '<section class="card"><div class="chead"><h2>The report</h2></div>' +
      '<div class="cbody">' +
      '<div class="kv">' +
      '<div class="k">Kind of issue</div><div class="v">' + esc(state.supportCategoryLabel(t.category)) + '</div>' +
      '<div class="k">Reported by</div><div class="v">' + esc(t.requesterName) +
      ' <span class="muted">· ' + esc(t.requesterRoleLabel) + '</span></div>' +
      '<div class="k">Institution</div><div class="v">' + esc(tenant ? tenant.name : '—') + '</div>' +
      '<div class="k">Experiment</div><div class="v">' +
      (ctx ? esc(ctx.experiment.name) : '<span class="muted">Not experiment specific</span>') + '</div>' +
      '<div class="k">Technology</div><div class="v">' +
      (def ? ui.fmtBadge(t.technology) + ' ' + esc(def.name) : '<span class="muted">Not technology specific</span>') + '</div>' +
      '</div>' +
      '<h3 style="font-size:13.5px;font-weight:640;margin:14px 0 4px">What they described</h3>' +
      '<p class="tk-d">' + esc(t.description) + '</p>' +
      (t.resolutionNote
        ? '<h3 style="font-size:13.5px;font-weight:640;margin:14px 0 4px">Resolution</h3>' +
          '<p class="tk-d">' + esc(t.resolutionNote) + '</p>'
        : t.previousResolution
        ? '<h3 style="font-size:13.5px;font-weight:640;margin:14px 0 4px">Previous resolution — reopened</h3>' +
          '<p class="tk-d">' + esc(t.previousResolution) + '</p>'
        : '') +
      decisionHTML +
      '</div></section>' +
      '</div>' +
      '<div class="stack">' +
      ui.card('History', timeline) +
      ui.gapNote('NOT IN THIS BUILD',
        'No SLA, response-time promise, priority or severity formula, external ticketing provider, chatbot, ' +
        'escalation path or knowledge base exists. No email, SMS or notification is sent at any point in this ' +
        'workflow — the reporter sees the state in the product.') +
      '</div></div>';

    return {
      title: t.subject, html: html, navKey: 'operations',
      after: function () {
        var form = document.getElementById('sr-form');
        if (form) {
          var busy = false;
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (busy) { return; }
            var note = (document.getElementById('sr-note-i') || {}).value || '';
            if (!String(note).trim()) {
              ui.showErrors(form, [{ field: 'sr-note', message: 'Say briefly what was done before resolving.' }],
                'Please complete the resolution');
              return;
            }
            busy = true;
            state.resolveSupportTicket(t.id, note);
            ui.toast('Report ' + t.id + ' resolved. The reporter can see the outcome.');
            XRSLP.render(false);
          });
        }
        var re = document.getElementById('sr-reopen');
        if (re) {
          re.addEventListener('click', function () {
            state.reopenSupportTicket(t.id, '');
            ui.toast('Report ' + t.id + ' reopened.');
            XRSLP.render(false);
          });
        }
      }
    };
  };
})();
