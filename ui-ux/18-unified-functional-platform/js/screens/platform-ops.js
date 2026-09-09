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

  /* WHERE A DEVICE REQUEST CURRENTLY SITS — and therefore whose move it
     is next.

     The corrected routing gives `submitted` a different meaning from the
     one this workspace used to read into it: the request is with the
     institution's own Institute / Tenant Admin, who is the platform's
     point of contact for it. It becomes the Super Admin's to decide only
     once that person has forwarded it, which is `escalated`.
     Treating `submitted` as "waiting on the platform" would put the
     student straight through to the Super Admin again — precisely the
     routing the correction removes — so the surface names the holder in
     its own column rather than leaving a status badge to imply it. */
  function transferHolderHTML(r) {
    var tenant = state.tenantById(r.tenantId);
    var who = tenant ? tenant.name : r.tenantId;
    if (r.status === state.TRANSFER_STATUS.SUBMITTED) {
      return '<span class="tmain">Institute / Tenant Admin</span>' +
        '<span class="tsub">' + esc(who) + '</span>' +
        '<span class="tsub">Theirs to review and forward — not the platform&rsquo;s to decide yet</span>';
    }
    if (r.status === state.TRANSFER_STATUS.ESCALATED) {
      return '<span class="tmain">The platform</span>' +
        '<span class="tsub">Forwarded by ' + esc(r.escalatedBy || 'the Institute / Tenant Admin') +
        (r.escalatedAt ? ' · ' + esc(util.fmtDate(r.escalatedAt)) : '') + '</span>' +
        (r.escalationNote
          ? '<span class="tsub">&ldquo;' + esc(r.escalationNote) + '&rdquo;</span>'
          : '<span class="tsub">No note was recorded with the forwarding.</span>');
    }
    return '<span class="tmain">Decided</span>' +
      '<span class="tsub">' + esc(r.decidedBy || 'Super Admin') +
      (r.decidedAt ? ' · ' + esc(util.fmtDate(r.decidedAt)) : '') + '</span>';
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
     R17 — THE DURABLE WITHDRAW / RESTORE LINE, RENDERED.

     `removedBy` / `removedAt` / `removedReason` describe the CURRENT
     state of a scope row and are cleared when it is restored — which
     used to mean that handing the authority back ERASED every trace
     that a Vendor, an Academic Reviewer or a Content Manager had ever
     been suspended, and why. The clarification grants the Super Admin
     genuine operational authority *with auditability*, and an override
     whose evidence disappears one click later is not auditable.

     The state layer now keeps an append-only `history` on the row.
     Nothing rendered it. This does.

     ⚠ IT IS RENDERED ON LIVE ROWS TOO, AND THAT IS THE POINT. A row
     that was withdrawn and then restored is `active` again and shows no
     `removed*` field at all; its history is the ONLY surviving evidence
     of the suspension. Dropping this from live rows would restore
     exactly the erasure the fix exists to prevent. */
  function assignmentHistoryHTML(m) {
    var entries = state.roleAssignmentHistory(m.id);
    if (!entries.length) { return ''; }
    return entries.map(function (e) {
      return '<div class="sc-m">' + esc(e.label) + ' by ' + esc(e.by) + ' · ' + esc(util.fmtDateTime(e.at)) +
        (e.note
          ? ' — &ldquo;' + esc(e.note) + '&rdquo;'
          : ' — <span class="muted">no reason was recorded</span>') + '</div>';
    }).join('');
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
        /* R17 — the suspension survives the restore, HERE as well as on
           the person's own page. A registry that shows a fully restored
           actor as indistinguishable from one who was never touched is
           the erasure again, one level up. It is deliberately worded as
           history, not as a current state: the badge says the scope WAS
           withdrawn, never that the person is suspended now. */
        var everSuspended = state.actorWasEverSuspended(a.id);
        return '<tr>' +
          '<td data-label="Person"><a class="rowlink" href="' + P.href.actor(a.id) + '">' +
          '<span class="tmain">' + esc(a.name) + '</span>' +
          '<span class="tsub">' + esc(a.organisation) + '</span></a>' +
          (everSuspended
            ? '<span class="tsub">' + ui.badge('b-neutral', 'clock', 'Has had a scope withdrawn') + '</span>'
            : '') + '</td>' +
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
      /* SCOPE, AS A PAGE LEDE RATHER THAN AS A TAGGED GAP NOTE. This is
         an ordinary statement of what a screen covers; the gapNote tag
         made it read as a defect report. */
      '<p class="chelp">These are <strong>platform</strong> roles. No institutional person appears here and no ' +
      'institutional role can be assigned from this screen — Faculty and Student records belong to the Tenant ' +
      'Admin, inside a tenant. Vendor, Academic Reviewer and Content Manager are the whole set; there is no ' +
      'way to create a new platform role.</p>' +
      '<div class="stack">' +
      (withoutScope.length
        ? ui.card('Needs attention', P.attentionList(withoutScope),
            withoutScope.length + ' ' + util.plural(withoutScope.length, 'person', 'people'), 'h2') : '') +
      sections + registerCard() +
      /* ⚠ REMOVED FROM THE UI, KEPT HERE: the "IDENTITY ORIGIN STILL NOT
         DECIDED" gap note (QD-02). It said the sources confirm who
         ASSIGNS a platform role but not how a person's identity first
         comes into being; that identity-provider role mapping and custom
         roles are later-phase; and that the standing instruction is to
         invent no invitation, activation or account-creation mechanism.
         All of that is build-process traceability. The single fact an
         operator needs from it — registering records a person and
         creates no account — is on the register form's own formnote,
         where the person is about to do it. */
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
            (m.assignedAt ? ' · ' + esc(util.fmtDate(m.assignedAt)) : '') + '</div>' +
            assignmentHistoryHTML(m) + '</div>' +
            '<button class="btn sm sec" type="button" data-rm-scope="' + esc(m.id) + '">Withdraw</button></li>';
        }).join('') + '</ul>'
      : ui.alertBox('warning', 'No scope assigned',
          '<p>This person holds no live scope, so nothing is actionable for them and no new work can start. ' +
          'Anything they decided in the past stays in the content history, and a Vendor still opens and reads ' +
          'every record they created &mdash; read-only.</p>');

    /* THE WHOLE OF "SUSPEND THIS VENDOR / REVIEWER / CONTENT MANAGER",
       and it introduces no new state to do it.

       There is no suspended flag, no disabled account and no lock in
       this build — a person reaches content through their scope rows
       and through nothing else — so withdrawing every row IS the
       suspension, and inventing a second mechanism beside it would give
       the platform two disagreeing answers to "what can this person
       touch?".

       It is offered as ONE decision because it is one judgement. Five
       separate withdrawals write five unrelated audit lines for a
       single act and leave the person half suspended if the Super Admin
       stops halfway. The state layer loops the ordinary single-row
       writer, so each row still carries its own line and each stays
       individually restorable. */
    var withdrawAllHTML = live.length
      ? '<div class="formact" style="margin:0 0 14px">' +
        '<button class="btn sec" type="button" id="ra-wall">' + ui.ic('minus') +
        'Withdraw every scope (' + live.length + ')</button>' +
        '<span class="formnote">One decision, one reason. Nothing is deleted, each withdrawn row stays ' +
        'individually restorable, and this person&rsquo;s name stays on the history of every record they have ' +
        'already acted on.</span></div>'
      : '';

    /* ── R17 — THE SUSPENSION THAT SURVIVES THE RESTORE ──────────
       True whenever ANY scope row has ever carried a withdrawal, live
       rows included, so it stays true after everything was handed back.
       It is stated as history and never as a current state: this person
       may be fully restored and working right now. Resolved before the
       lists below, because the "nothing is withdrawn" empty state has
       to know about it — saying "no scope has been withdrawn from this
       person" directly under a live row whose own history says one was
       is the contradiction this whole correction is about. */
    var everSuspended = state.actorWasEverSuspended(actor.id);

    /* RESTORING IS THE MITIGATION, so it is offered at the same weight
       as the suspension. "Withdraw every scope" exists because
       suspending is one judgement; putting the person back to work had
       to be taken one row at a time, which made the reversible half of
       a reversible act the harder half. This loops the ordinary
       single-row writer, so every restore still writes its own audit
       entry and nothing new is invented in the state layer. */
    var restoreAllHTML = gone.length > 1
      ? '<div class="formact" style="margin:0 0 12px">' +
        '<button class="btn sec" type="button" id="ra-rall">' + ui.ic('check') +
        'Restore every withdrawn scope (' + gone.length + ')</button>' +
        '<span class="formnote">One decision, one reason, recorded separately against each scope. The ' +
        'withdrawals themselves are <strong>not</strong> erased &mdash; each row keeps the permanent record of ' +
        'having been withdrawn and why.</span></div>'
      : '';

    var goneHTML = gone.length
      /* ⚠ A RESTORE THE STATE LAYER WILL REFUSE MUST NOT LOOK AVAILABLE
         — 07.3 adversarial fix. `restorePlatformRoleAssignment()` returns
         null when an IDENTICAL live scope already covers this actor
         (re-assigned after the withdrawal), and the confirm dialog was
         promising "they get this scope back immediately" before the
         refusal surfaced in a toast afterwards. The condition is fully
         computable here, so the button is disabled and says why. */
      /* `.muted-list` had no rule in any stylesheet; `.sc.off` on the
         child row is what actually distinguishes a withdrawn scope. */
      ? '<ul class="scopelist">' + gone.map(function (m) {
          var covered = live.some(function (x) {
            return x.scope === m.scope && x.courseId === m.courseId &&
                   x.experimentId === m.experimentId;
          });
          /* The durable line ALREADY contains this withdrawal, so
             printing the `removed*` fields beside it would say the same
             sentence twice. The current-state line is kept only as the
             fallback for a row saved before the history existed — an
             older browser save is still loadable, and it must not lose
             the reason it does hold. */
          var hist = assignmentHistoryHTML(m);
          return '<li class="sc off"><span class="sc-b">' + ui.ic('minus') + '</span>' +
            '<div class="sc-body"><div class="sc-t">' + esc(scopeLabel(m)) + '</div>' +
            (hist
              ? hist
              : '<div class="sc-m">Withdrawn ' + esc(util.fmtDate(m.removedAt)) +
                (m.removedReason ? ' — ' + esc(m.removedReason) : '') + '</div>') +
            (covered
              ? '<div class="sc-m">Already covered by a live scope above, so there is nothing to restore &mdash; ' +
                'this row stays as the record of the withdrawal.</div>'
              : '') +
            '</div>' +
            (covered
              ? '<button class="btn sm sec" type="button" disabled aria-disabled="true">Restore</button>'
              : '<button class="btn sm sec" type="button" data-rs-scope="' + esc(m.id) + '">Restore</button>') +
            '</li>';
        }).join('') + '</ul>'
      : '<p class="muted">No scope is withdrawn at the moment.' +
        (everSuspended
          ? ' One that was withdrawn earlier has since been restored &mdash; the record of that withdrawal, and ' +
            'of the restore, stays permanently on the live scope above.'
          : '') + '</p>';

    var suspensionAlert = everSuspended
      ? ui.alertBox('info', 'A scope has been withdrawn from this person before',
          '<p>At least one of the scopes below has been <strong>withdrawn</strong> at some point. This says ' +
          'nothing about what ' + esc(actor.name) + ' holds <em>now</em> &mdash; the live scopes are listed ' +
          'first, and they may all have been restored since.</p>' +
          '<p style="margin-top:8px">The record of a withdrawal is <strong>permanent</strong> and is written on ' +
          'the scope row itself, so restoring the authority does not erase the evidence that it was taken away. ' +
          'Each withdrawal and each restore is listed under the scope it applies to, with who did it, when, and ' +
          'the reason they gave.</p>')
      : '';

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
      ui.phead(actor.name, esc(state.contentRoleLabel(actor.role)) + ' · ' + esc(actor.organisation),
        null, everSuspended ? ' ' + ui.badge('b-neutral', 'clock', 'Has had a scope withdrawn') : '') +
      suspensionAlert +
      '<div class="grid-rail">' +
      '<div class="stack">' +
      ui.card('Assigned scope', withdrawAllHTML + liveHTML +
        '<h3 class="vh">Withdrawn</h3>' + restoreAllHTML + goneHTML, null, 'h2') +
      addCard + '</div>' +
      '<div class="stack">' +
      ui.card('Identity',
        '<div class="kv">' +
        '<div class="k">Name</div><div class="v">' + esc(actor.name) + '</div>' +
        '<div class="k">Platform role</div><div class="v">' + esc(state.contentRoleLabel(actor.role)) + '</div>' +
        '<div class="k">Organisation</div><div class="v">' + esc(actor.organisation) + '</div>' +
        '<div class="k">Contact</div><div class="v">' + esc(actor.email) + '</div>' +
        /* R20 — "What is this origin? ... I have to remove it".
           The label is gone; the FACT is not, because it is load-bearing
           here in a way it is nowhere else: it is what tells the reader
           whether they are looking at a real person the Super Admin
           recorded or at sample data, and the cardfoot below turns on
           exactly this distinction. It is now a sentence under a
           question a person would ask, in place of a one-word provenance
           token from the prototype's own vocabulary. */
        '<div class="k">How this person was added</div><div class="v">' +
        esc(actor.source === 'seed'
          ? 'Included with the prototype as sample data.'
          : 'Recorded here on the platform by the Super Admin.') + '</div>' +
        '</div>' +
        '<p class="cardfoot">' +
        (actor.source === 'seed'
          ? 'A sample identity, not a real person. No account, credential or invitation exists behind it.'
          /* The open question about where an identity first comes from
             (QD-02) is a build-team question; the operator needs only
             what this record is and is not. */
          : 'Recorded on this platform by the Super Admin. It names a person and nothing more — no account, ' +
            'password, credential, invitation or single sign-on exists behind it, and none is implied.') +
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
                '<label for="ra-reason-i">Reason <span class="req">(required)</span></label>' +
                '<input type="text" id="ra-reason-i" autocomplete="off">' +
                '<p class="hint">Recorded against the withdrawn scope and shown wherever it is listed.</p></div>',
              okLabel: 'Withdraw scope',
              onConfirm: function (body) {
                var input = body ? body.querySelector('#ra-reason-i') : null;
                var out = state.removePlatformRoleAssignment(id, input ? input.value : '');
                /* A withdrawal freezes somebody's workspace, so the
                   state layer now refuses one with no reason. Nothing
                   was written; say exactly that rather than reporting a
                   success that did not happen. */
                if (!out) {
                  ui.toast('Nothing was changed — a reason is required to withdraw a scope.', 'info');
                  ui.announce('The scope was not withdrawn. A reason is required.');
                  return;
                }
                ui.toast('Scope withdrawn. Work already held under it becomes read-only; nothing is deleted.');
                XRSLP.render(false);
              }
            });
          });
        });

        var wall = document.getElementById('ra-wall');
        if (wall) {
          wall.addEventListener('click', function () {
            ui.openDialog({
              title: 'Withdraw every scope from ' + actor.name + '?',
              bodyHTML:
                '<p><strong>' + esc(actor.name) + '</strong> currently holds <strong>' + live.length + '</strong> ' +
                util.plural(live.length, 'scope') + '. Withdrawing all of them at once leaves this ' +
                esc(state.contentRoleLabel(actor.role)) + ' reaching <strong>no content at all</strong>: nothing ' +
                'is actionable in their workspace, and every record they hold becomes <strong>read-only</strong> ' +
                'to them — no editing, no submitting or resubmitting, no change of Course, technology, package ' +
                'or metadata.</p>' +
                '<div class="consequence">' + ui.ic('info') + '<span><strong>Nothing is deleted and nothing is ' +
                'hidden.</strong> Completed academic decisions, submissions, publications and history entries ' +
                'stay exactly as they were made, with this person&rsquo;s name on them, and a Vendor still opens ' +
                'and reads every record they created. Each row is recorded as withdrawn <strong>separately</strong> ' +
                'and can be restored on its own.</span></div>' +
                '<div class="consequence">' + ui.ic('alertCirc') + '<span>This is the whole of &ldquo;suspend this ' +
                'person&rdquo;. There is no separate suspended state, no account is disabled and no credential is ' +
                'revoked &mdash; none of those exists in this build. Where nobody else covers the work they held, ' +
                'a record can be left with no live actor at its current stage.</span></div>' +
                '<div class="field" id="ra-wall-reason" style="margin-top:12px">' +
                '<label for="ra-wall-reason-i">Reason <span class="req">(required)</span></label>' +
                '<input type="text" id="ra-wall-reason-i" autocomplete="off">' +
                '<p class="hint">The same reason is recorded against every scope this decision withdraws.</p></div>',
              okLabel: 'Withdraw every scope',
              onConfirm: function (body) {
                var input = body ? body.querySelector('#ra-wall-reason-i') : null;
                var out = state.withdrawAllScopesForActor(actor.id, input ? input.value : '');
                if (!out) {
                  ui.toast('Nothing was changed — a reason is required to withdraw a scope.', 'info');
                  ui.announce('No scope was withdrawn. A reason is required.');
                  return;
                }
                ui.toast(out.length + ' ' + util.plural(out.length, 'scope') + ' withdrawn from ' + actor.name +
                  '. Nothing was deleted and every row can be restored.');
                XRSLP.render(false);
              }
            });
          });
        }
        /* RESTORING IS AN OVERRIDE TOO, so it gets an override's
           treatment: the consequence stated before it is taken, and a
           box to say why.

           ⚠ THE REASON IS OPTIONAL HERE, AND THAT ASYMMETRY IS
           DELIBERATE. Withdrawing freezes somebody's workspace and the
           state layer refuses one without a reason; restoring hands the
           authority back, and refusing it for want of a sentence would
           leave a person unable to work over a piece of paperwork. The
           hint says so rather than leaving the difference to look like
           an oversight. What is NOT optional is the record: the
           withdrawal it reverses stays on the row permanently. */
        Array.prototype.slice.call(document.querySelectorAll('[data-rs-scope]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-rs-scope');
            var m = state.roleAssignmentById(id);
            if (!m) { return; }
            ui.openDialog({
              title: 'Restore ' + scopeLabel(m) + '?',
              bodyHTML:
                '<p><strong>' + esc(actor.name) + '</strong> gets this scope back immediately, in their own ' +
                'workspace: new work becomes actionable again, and the records they hold under it stop being ' +
                'read-only.</p>' +
                '<div class="consequence">' + ui.ic('shield') + '<span><strong>The withdrawal is not erased.</strong> ' +
                'It stays on this scope permanently &mdash; who withdrew it, when, and the reason they gave &mdash; ' +
                'and so does this restore. Handing the authority back does not remove the evidence that it was ' +
                'taken away.</span></div>' +
                (m.removedReason
                  ? '<div class="consequence">' + ui.ic('doc') + '<span>It was withdrawn' +
                    (m.removedAt ? ' on ' + esc(util.fmtDate(m.removedAt)) : '') + ' for this reason: &ldquo;' +
                    esc(m.removedReason) + '&rdquo;</span></div>'
                  : '') +
                '<div class="field" id="rs-reason" style="margin-top:12px">' +
                '<label for="rs-reason-i">Reason <span class="muted">(optional)</span></label>' +
                '<input type="text" id="rs-reason-i" autocomplete="off" aria-describedby="rs-reason-h">' +
                '<p class="hint" id="rs-reason-h">Optional on purpose: a withdrawal freezes somebody&rsquo;s ' +
                'workspace and is refused without a reason, while a restore hands the work back &mdash; nobody ' +
                'should stay unable to work because a sentence is missing. It is recorded against this scope if ' +
                'you give one. Nothing is sent to anybody.</p></div>',
              okLabel: 'Restore scope',
              onConfirm: function (body) {
                var input = body ? body.querySelector('#rs-reason-i') : null;
                var out = state.restorePlatformRoleAssignment(id, input ? input.value : '');
                if (!out) {
                  ui.toast('Nothing was changed — an identical live scope already covers this.', 'info');
                  ui.announce('The scope was not restored; an identical live scope already exists.');
                  return;
                }
                ui.toast('Scope restored. Editing, submission and new work return to this workspace, and the ' +
                  'withdrawal stays on the record.');
                XRSLP.render(false);
              }
            });
          });
        });

        /* Restoring every withdrawn row as ONE decision — the mirror of
           "Withdraw every scope". It loops the ordinary writer, and it
           reports what actually happened rather than assuming: a row
           whose scope is already covered by an identical live
           assignment is refused by the state layer, and pretending
           otherwise would be a success message for a write that did not
           occur. */
        var rall = document.getElementById('ra-rall');
        if (rall) {
          rall.addEventListener('click', function () {
            ui.openDialog({
              title: 'Restore every withdrawn scope for ' + actor.name + '?',
              bodyHTML:
                '<p>All <strong>' + gone.length + '</strong> withdrawn ' + util.plural(gone.length, 'scope') +
                ' are handed back to <strong>' + esc(actor.name) + '</strong> at once. Their workspace becomes ' +
                'actionable again wherever these scopes reach.</p>' +
                '<div class="consequence">' + ui.ic('shield') + '<span><strong>No withdrawal is erased.</strong> ' +
                'Each row keeps the permanent record of having been withdrawn, by whom and why, and each restore ' +
                'is recorded separately beside it.</span></div>' +
                '<div class="consequence">' + ui.ic('info') + '<span>A row whose scope is already covered by an ' +
                'identical live assignment is left alone rather than duplicated. You will be told how many were ' +
                'actually restored.</span></div>' +
                '<div class="field" id="rall-reason" style="margin-top:12px">' +
                '<label for="rall-reason-i">Reason <span class="muted">(optional)</span></label>' +
                '<input type="text" id="rall-reason-i" autocomplete="off">' +
                '<p class="hint">The same reason is recorded against every scope this decision restores.</p></div>',
              okLabel: 'Restore every scope',
              onConfirm: function (body) {
                var input = body ? body.querySelector('#rall-reason-i') : null;
                var why = input ? input.value : '';
                var done = 0;
                gone.forEach(function (m) {
                  if (state.restorePlatformRoleAssignment(m.id, why)) { done += 1; }
                });
                if (!done) {
                  ui.toast('Nothing was changed — every withdrawn scope is already covered by a live one.', 'info');
                  ui.announce('No scope was restored.');
                  return;
                }
                ui.toast(done + ' of ' + gone.length + ' ' + util.plural(gone.length, 'scope') + ' restored for ' +
                  actor.name + '. Every withdrawal stays on the record.');
                XRSLP.render(false);
              }
            });
          });
        }
      }
    };
  };

  /* ============================================================
     OPERATIONS — device transfers · support · expiry attention.
     ============================================================ */
  XRSLP.screens.platformOperations = function () {
    var transfers = state.deviceTransferRequests().slice().sort(function (a, b) { return (b.seq || 0) - (a.seq || 0); });
    /* THE PLATFORM'S QUEUE IS THE ESCALATED ONE, and it is read from the
       single selector every other Super Admin count reads, so the
       heading figure here can never disagree with the Overview tile. The
       table below still lists every request whatever its state — seeing
       that a request exists and is with its institution is useful — but
       only the forwarded ones are counted as needing attention. */
    var openTransfers = state.transfersAwaitingDecision();
    var withTenant = transfers.filter(function (r) { return r.status === state.TRANSFER_STATUS.SUBMITTED; });
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
        /* 07.3 — deliberately KEPT, and renamed. Unlike the content
           tables, this column is not a restatement of Status: it names
           the institution, who forwarded the request, when, and the
           forwarding note. Renamed so it reads as the extra detail it
           is rather than as the duplicate the stakeholder objected to. */
        '<th scope="col">Where it sits &amp; why</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
        transfers.map(function (r) {
          var t = state.tenantById(r.tenantId);
          var m = state.transferStatusMeta(r.status);
          /* `def` is no longer the source of the technology cell — see
             `transferTechHTML`. */
          var mine = r.status === state.TRANSFER_STATUS.ESCALATED;
          return '<tr>' +
            '<td data-label="Request"><a class="rowlink" href="' + P.href.transfer(r.id) + '">' +
            '<span class="tmain">' + esc(r.id) + '</span>' +
            '<span class="tsub">' + esc(util.fmtDate(r.createdAt)) + '</span></a></td>' +
            '<td data-label="Student">' + esc(r.personName) + '</td>' +
            '<td data-label="Institution">' + esc(t ? t.name : r.tenantId) + '</td>' +
            '<td data-label="Technology">' + transferTechHTML(r) + '</td>' +
            '<td data-label="Status">' + ui.badge(m.badge, m.icon, m.label) + '</td>' +
            '<td data-label="Where it sits &amp; why">' + transferHolderHTML(r) + '</td>' +
            '<td class="cell-actions"><a class="btn sm ' + (mine ? 'pri' : 'sec') + '" href="' +
            P.href.transfer(r.id) + '">' + (mine ? 'Review' : 'Open') + '</a></td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>'
      : ui.emptyRow({
          ok: true, heading: 'h3',
          title: 'No device requests',
          body: 'A student raises one in their own workspace; it reaches the platform only once their ' +
            'Institute / Tenant Admin forwards it.'
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
      : ui.emptyRow({
          ok: true, heading: 'h3',
          title: 'No issues reported',
          body: 'Students, Faculty, Tenant Admins and the content roles report technical issues from Help in ' +
            'their own workspace. Reports arrive here.'
        });

    /* ---- expiry ---- */
    /* WHAT A RENEWAL FOR THIS RECORD WOULD HAVE TO GO THROUGH.
       Derived per record from the INSTITUTION and its original
       onboarding request — never from the prototype scenario selector,
       which speaks for whoever the demo currently has selected and
       would put a BITS-Community institution on the payment route the
       moment the external scenario was chosen. */
    function renewalRouteCell(rec) {
      var open = state.openRenewalForAccess(rec.id);
      /* PER RECORD — 07.3 adversarial fix. This was handed the record and
         then discarded it, asking the INSTITUTION's route instead. An
         institution holding records from two routes had both rows print
         the first record's route, and one of them was a lie. */
      var route = state.renewalRouteForAccess(rec.id);
      var routeLine = !route
        ? 'This record is not bound to an institution, so it has no renewal route.'
        : route.paymentRequired
        ? 'Route: the same payment step this access was bought through.'
        : 'Route: no payment step — that is how this access was granted.';
      if (!open) {
        return '<span class="muted">None in flight</span>' +
          '<span class="tsub">' + esc(routeLine) + '</span>';
      }
      return '<a class="rowlink" href="' + P.href.request(open.id) + '">' +
        '<span class="tmain">' + esc(open.id) + '</span></a>' +
        '<span class="tsub">' + ui.statusBadge(open.status) + '</span>' +
        '<span class="tsub">' + esc(routeLine) + '</span>';
    }

    var expiryBody = (reminders.length || expired.length)
      ? '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Access terms needing attention</caption>' +
        '<thead><tr><th scope="col">Approved content</th><th scope="col">Institution</th>' +
        '<th scope="col">Term ends</th><th scope="col">Remaining</th><th scope="col">State</th>' +
        '<th scope="col">Renewal</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
        reminders.concat(expired).map(function (rec) {
          var t = state.tenantById(rec.tenantId);
          var days = state.accessDaysUntilExpiry(rec);
          var live = state.accessIsLive(rec);
          return '<tr>' +
            /* The renewal queue led with the record key, so an operator
               scanning for "which access is about to lapse" read a column
               of identifiers. The content leads; the reference follows. */
            '<td data-label="Approved content"><span class="tmain">' + ui.accessTitle(rec) + '</span>' +
            '<span class="tsub">' + ui.accessScope(rec) +
            ' · ' + rec.quantity + ' ' + util.plural(rec.quantity, 'user') + '</span>' +
            '<span class="tsub">' + ui.techBadges(ui.recTechnologies(rec)) + '</span></td>' +
            '<td data-label="Institution">' + esc(t ? t.name : rec.tenantId) + '</td>' +
            '<td data-label="Term ends">' + esc(util.fmtDate(rec.endsOn)) + '</td>' +
            '<td data-label="Remaining" class="num">' + (live && days != null ? days + ' ' + util.plural(days, 'day') : '—') + '</td>' +
            '<td data-label="State">' + (live
              ? ui.badge('b-warning', 'clock', 'Reminder due')
              : ui.badge('b-danger', 'alertCirc', 'Expired')) + '</td>' +
            '<td data-label="Renewal">' + renewalRouteCell(rec) + '</td>' +
            '<td class="cell-actions"><a class="btn sm sec" href="' + P.href.institution(rec.tenantId) + '">Institution</a></td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>'
      : ui.emptyRow({
          ok: true, heading: 'h3',
          title: 'No access term needs attention',
          body: 'None ends within the next 15 days, and none has expired.'
        });

    /* THE RENEWAL RULE, STATED WHERE THE EXPIRY IS SEEN.
       There is deliberately NO renewal-creation control on this card.
       The institution raises a renewal against its own record; it
       arrives on the ordinary Access requests queue and is decided
       there, on the surface that already exists. Putting a "renew"
       button here would invent a Super Admin power to extend a term,
       which no source grants and which the state layer has no writer
       for. */
    var renewalFoot =
      '<p class="cardfoot"><strong>Nobody can extend an access term directly</strong> — not the student, not ' +
      'the Institute / Tenant Admin, not the Super Admin, not this screen. The institution raises a renewal ' +
      'against the record it holds; it arrives on the <a href="' + P.href.requests() + '">Access requests</a> ' +
      'queue as an ordinary request marked as a renewal, and the term moves only when that request activates. ' +
      'The Renewal column above shows each record&rsquo;s own route.</p>' +
      /* The rest was three restatements of one rule plus a defence of
         how the route is derived. What survives is what an operator
         cannot work out from the table: what a renewal may and may not
         change, and that a renewal in flight has not moved anything yet. */
      ui.about('What a renewal can and cannot change',
        '<p>A renewal <strong>extends the record it names</strong>. Its id, assignments, Faculty mappings and ' +
        'licence allocation all stay exactly where they are, and no second record is created.</p>' +
        '<p>It <strong>mirrors the current plan</strong> — the same experiments, technologies, licence count ' +
        'and term length — and is decided without the allocation controls an ordinary request carries. An ' +
        'institution that wants more raises an ordinary access request instead, which adds a second record ' +
        'beside the one it holds.</p>' +
        '<p>Requesting a renewal extends nothing on its own. An institution on the <strong>Subscription</strong> ' +
        'context completes the same payment step it was onboarded through; one on <strong>BITS Community</strong> ' +
        'has no payment step, so approval activates the renewal at once.</p>');

    /* ⚠ PROTOTYPE-ONLY. The 15-day reminder is a confirmed requirement
       (STK31-28), but no product action can reach the state: the
       shortest access term a request can carry is Monthly, so every
       activated record starts about thirty days out. Without this, the
       confirmed rule could be asserted in the test suite and never seen
       in a walkthrough. It moves one record's end date and nothing else
       — no quantity, no item, no assignment, no entitlement — and there
       is no product control that does this.

       ⚠ IT IS NOT A RENEWAL AND NOT AN EXTENSION. Now that renewal
       exists as a real route, the one thing this control must never be
       mistaken for is a Super Admin power to move a term. It winds the
       demo clock in BOTH directions and writes no request, no decision
       and no renewal history; the only writer that lengthens a term on
       purpose is the activation of a renewal request the institution
       itself raised. The copy below says so in the user's own words. */
    var liveRecords = state.accessAll().filter(state.accessIsLive);
    var expiryDemo = liveRecords.length
      ? ui.demoPanel('Demo clock — move an access term’s end date',
          '<p>The shortest access term is Monthly, so a freshly activated record is about thirty days from its ' +
          'end date and the confirmed 15-day rule cannot be reached by using the product. This moves one ' +
          'record&rsquo;s end date, in either direction, so the rule can be seen on a real record.</p>' +
          '<p><strong>It is not a renewal and not an extension.</strong> It grants nothing, writes no request, ' +
          'records no decision and changes no quantity, assignment or licence allocation. Moving access past ' +
          'its end date expires it, exactly as the real date would; moving it back restores it.</p>' +
          '<div class="frow">' +
          '<div class="field"><label for="xp-rec">Approved content</label>' +
          '<select id="xp-rec">' + liveRecords.map(function (rec) {
            var t = state.tenantById(rec.tenantId);
            /* Content and institution first; the reference trails, as it
               does everywhere else. An <option> carries no markup, so it
               cannot be styled down — only ordered. */
            return '<option value="' + esc(rec.id) + '">' +
              esc(XRSLP.tenantUI.accessChoiceLabel(rec) + ' — ' + (t ? t.name : rec.tenantId)) +
              '</option>';
          }).join('') + '</select></div>' +
          '<div class="field"><label for="xp-days">Ends in</label>' +
          '<select id="xp-days">' +
          '<option value="16">16 days (not due)</option>' +
          '<option value="15" selected>15 days (reminder due)</option>' +
          '<option value="10">10 days (reminder due)</option>' +
          '<option value="-1">already ended (expired)</option>' +
          '</select></div>' +
          '</div>' +
          '<div class="formact"><button class="btn sec sm" type="button" id="xp-go">Move the end date</button>' +
          '</div>')
      : '';

    var needing = openTransfers.length + openTickets.length + reminders.length;

    var html =
      ui.phead('Operations',
        needing
          ? needing + ' ' + util.plural(needing, 'item') + ' ' + (needing === 1 ? 'needs' : 'need') + ' attention'
          : 'Device transfers, support reports and access-term expiry — nothing is waiting') +
      /* THE QUEUE COUNTS FIRST. Four figures say whether this screen
         needs the operator at all, before they read three tables to find
         out. Every one is the same selector the Overview tile and the
         nav badge read, so they cannot disagree. */
      ui.statStrip([
        { v: openTransfers.length, k: 'Device transfers to decide',
          tone: openTransfers.length ? 'warn' : '' },
        { v: openTickets.length, k: 'Support reports open', tone: openTickets.length ? 'warn' : '' },
        { v: reminders.length, k: 'Terms ending within 15 days', tone: reminders.length ? 'warn' : '' },
        { v: expired.length, k: 'Terms already expired', tone: expired.length ? 'bad' : '' },
        { v: withTenant.length, k: 'With an institution, not ours' }
      ]) +
      '<div class="stack">' +
      ui.card('Device replacement and transfer', transferBody +
        '<p class="cardfoot">A device request reaches the platform <strong>through the institution</strong>: ' +
        'it becomes yours to decide only once that institution&rsquo;s Tenant Admin has forwarded it. ' +
        (withTenant.length
          ? '<strong>' + withTenant.length + ' ' + util.plural(withTenant.length, 'request') + '</strong> ' +
            (withTenant.length === 1 ? 'is' : 'are') + ' still with an institution and cannot be decided here.'
          : 'Nothing is currently waiting on an institution.') +
        ' A decision moves the authorised device binding and nothing else — no licence, experiment, technology ' +
        'or assessment state changes, and no hardware is registered or certified.</p>',
        openTransfers.length ? String(openTransfers.length) + ' to decide' : null, 'h2') +
      ui.card('Support reports', supportBody +
        '<p class="cardfoot">No response time is promised and no priority is assigned. ' +
        '<strong>Nothing is sent to anybody</strong> — the reporter sees the state in their own workspace.</p>',
        openTickets.length ? String(openTickets.length) + ' open' : null, 'h2') +
      ui.card('Access terms, the 15-day reminder and renewal',
        expiryBody + renewalFoot +
        /* The reminder note lives HERE and nowhere else — this is the
           surface that owns the reminder state. See `P.reminderNote`. */
        '<div style="margin-top:14px">' + P.reminderNote() + '</div>',
        reminders.length ? String(reminders.length) + ' due' : null, 'h2') +
      /* The demo clock is not product UI, so it does not sit inside an
         operational card. It is the only prototype control on this
         screen; it stays available because the 15-day rule cannot
         otherwise be demonstrated, and it stays collapsed and dashed
         because it is scaffolding. */
      expiryDemo +
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
    /* THE DECISION IS THE PLATFORM'S ONLY ONCE THE INSTITUTION HAS
       FORWARDED IT. `submitted` no longer means "waiting on the Super
       Admin" — it means the request is with the institution's own
       Institute / Tenant Admin — so the Approve / Decline controls hang
       off `escalated` and nothing else. This is not cosmetic: the state
       layer refuses `decideDeviceTransfer` on a submitted record, so
       rendering the buttons there would have offered a control that
       silently did nothing. */
    var mine = r.status === state.TRANSFER_STATUS.ESCALATED;
    var withTenant = r.status === state.TRANSFER_STATUS.SUBMITTED;
    var actingAdmin = state.actingTenantAdmin(r.tenantId);

    var entitled = person ? state.studentExperiments(person.id).filter(function (row) { return row.effective; }) : [];

    var decisionHTML;
    if (mine) {
      decisionHTML = '<div class="decidebar">' +
        '<span class="db-note">Forwarded by ' + esc(r.escalatedBy || 'the Institute / Tenant Admin') +
        (r.escalatedAt ? ' on ' + esc(util.fmtDate(r.escalatedAt)) : '') + '. ' +
        'Approving moves the authorised device binding to the replacement device. ' +
        'It consumes no licence, grants no experiment, adds no technology and changes no assessment state.</span>' +
        '<button class="btn sec" type="button" id="dt-decline">Decline</button>' +
        '<button class="btn pri" type="button" id="dt-approve">' + ui.ic('check') + 'Approve transfer</button>' +
        '</div>';
    } else if (withTenant) {
      /* THE HONEST STATE. There is deliberately no disabled Approve
         button here: the platform genuinely cannot act, and an absent
         capability is shown as absent rather than as a greyed control.
         The institution with no assigned Tenant Admin is a real and
         reachable state — `escalateDeviceTransfer` returns null for it —
         so it is named rather than papered over. */
      decisionHTML = '<div class="decidebar"><span class="db-note">' +
        'This request is still with <strong>' + esc(tenant ? tenant.name : r.tenantId) + '</strong> — its own ' +
        'Institute / Tenant Admin reviews it and forwards it, and only then is it the platform&rsquo;s to ' +
        'approve or decline. Nothing about the request has changed and nothing has been sent to anybody. ' +
        (actingAdmin
          ? 'The assigned Tenant Admin is <strong>' + esc(actingAdmin.name) + '</strong>.'
          : '<strong>No Tenant Admin is assigned to this institution</strong>, so nobody there can forward it. ' +
            'Assign one on its <a href="' + P.href.institution(r.tenantId) + '">institution report</a>.') +
        '</span></div>';
    } else {
      decisionHTML = '<div class="decidebar"><span class="db-note">' +
        (r.status === state.TRANSFER_STATUS.APPROVED
          ? 'Approved ' + esc(util.fmtDateTime(r.decidedAt)) + '. The student can see this outcome in their workspace.'
          : 'Declined ' + esc(util.fmtDateTime(r.decidedAt)) + '. The student can see this outcome and the reason.') +
        '</span></div>';
    }

    /* The forwarding step carries the neutral `info` tone on purpose.
       It is a movement, not an outcome, and it is very often the LAST
       entry on the timeline — giving it the green `good` tone would put
       a green dot at the end of a request that has not been decided and
       read, at a glance, as an approval. The arrow icon is what
       distinguishes it from the original raising of the request. */
    var timeline = '<div class="timeline">' + r.history.map(function (h) {
      var cls = h.kind === 'approved' ? 'good' : h.kind === 'declined' ? 'warn' : 'info';
      return '<div class="tl-item"><span class="tl-dot ' + cls + '">' +
        ui.ic(h.kind === 'approved' ? 'check' : h.kind === 'declined' ? 'x'
          : h.kind === 'escalated' ? 'arrowR' : 'monitor') + '</span>' +
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
      /* WHO SENT IT HERE, on the record itself rather than only in the
         timeline. The Super Admin is deciding on the strength of an
         institutional review, so the person who performed that review is
         part of what is being decided, not an audit footnote. */
      (r.escalatedBy
        ? '<div class="k">Forwarded by</div><div class="v">' + esc(r.escalatedBy) +
          ' <span class="muted">· Institute / Tenant Admin' +
          (r.escalatedAt ? ' · ' + esc(util.fmtDateTime(r.escalatedAt)) : '') + '</span></div>' +
          '<div class="k">Forwarding note</div><div class="v">' +
          (r.escalationNote ? esc(r.escalationNote)
                            : '<span class="muted">None recorded</span>') + '</div>'
        : '') +
      (r.decisionNote ? '<div class="k">Decision note</div><div class="v">' + esc(r.decisionNote) + '</div>' : '') +
      /* ⚠ `.decidebar` CARRIES ITS OWN PADDING AND A BOTTOM RADIUS that
         has to meet the card edge, so it belongs OUTSIDE `.cbody`. It
         was rendered inside it here and on the support report, which
         made the component's shape contradict its position — an inset
         grey block with rounded bottom corners floating in the middle of
         20px of padding. One placement rule, applied on every detail
         screen in this workspace. */
      '</div></div>' + decisionHTML + '</section>' +
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
      ui.card('History', timeline, null, 'h2') +
      /* WHAT IS AND IS NOT BEING CERTIFIED — genuinely useful before
         approving, so it stays, in two sentences. The "later-phase"
         roadmap clause is gone.
         ⚠ ALSO REMOVED FROM THE UI: an "IMPLEMENTATION JUDGEMENT" note
         saying the requirement contains no rejection behaviour and that
         the Decline path was an implementer's decision. That is a note
         from the implementer to a reviewer of the build, rendered beside
         a live Decline button that works and already demands a reason.
         The judgement itself is unchanged and is recorded here: the
         confirmed flow is request → approve; Decline exists so a request
         cannot sit open forever. */
      ui.about('What a device approval actually certifies',
        '<p>The platform holds a device <em>transfer approval</em> with no device <em>registry</em> behind it: ' +
        'the binding is a relationship, not an administrable record.</p>' +
        '<p>Nothing here registers hardware, names a model or certifies compatibility. The request records ' +
        'what the student told us.</p>') +
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
      '<h3 class="vh">What they described</h3>' +
      '<p class="tk-d">' + esc(t.description) + '</p>' +
      /* THE EVIDENCE THE REPORTER SENT, rendered by the SAME shared
         helper their own Help page uses — so the person who attached it
         and the person acting on it see the same thing rather than two
         descriptions of it. Renders nothing when nothing was attached. */
      XRSLP.supportUI.ticketMediaHTML(t, { reviewer: true }) +
      (t.resolutionNote
        ? '<h3 class="vh">Resolution</h3>' +
          '<p class="tk-d">' + esc(t.resolutionNote) + '</p>'
        : t.previousResolution
        ? '<h3 class="vh">Previous resolution — reopened</h3>' +
          '<p class="tk-d">' + esc(t.previousResolution) + '</p>'
        : '') +
      /* The resolve FORM belongs inside `.cbody` (it has no padding of
         its own); the resolved-state `.decidebar` belongs outside it.
         Same rule as the device transfer above. */
      (open ? decisionHTML + '</div></section>' : '</div>' + decisionHTML + '</section>') +
      '</div>' +
      '<div class="stack">' +
      ui.card('History', timeline, null, 'h2') +
      /* The load-bearing half — that the reporter was NOT notified — is
         stated on the resolve control itself and on the Operations card.
         What is gone is the eight-item list of absent capabilities (SLA,
         priority formula, chatbot, escalation path, knowledge base…),
         which was scope documentation for the build team. None of them
         exists; none of them is implied anywhere on this screen. */
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
        /* R17 — reopening WAS a bare one-click write with an empty note,
           so the report's own timeline recorded that it had been
           reopened and nothing whatever about why. A support report is
           one of the few places a Content Manager, an Academic Reviewer
           or a Vendor actually reaches the Super Admin, and reopening
           one contradicts a resolution somebody already gave; the reason
           is the whole content of that decision. The state layer accepts
           an empty note, so this is a screen-level requirement — and it
           is enforced honestly rather than announced and ignored:
           nothing is written until there is a reason. */
        var re = document.getElementById('sr-reopen');
        if (re) {
          re.addEventListener('click', function () {
            ui.openDialog({
              title: 'Reopen report ' + t.id + '?',
              bodyHTML:
                '<p>The report returns to <strong>open</strong> and appears again on the Operations queue. The ' +
                'resolution recorded against it stops being its current resolution and is kept as the previous ' +
                'one, so nothing claims the problem was dealt with while it is open.</p>' +
                '<div class="consequence">' + ui.ic('info') + '<span>Reopening changes nothing else: no ' +
                'entitlement, licence, assignment, content state or academic decision. <strong>Nothing is sent ' +
                'to anybody</strong> — the reporter sees the state on their own Help page.</span></div>' +
                '<div class="field" id="sr-ro" style="margin-top:12px">' +
                '<label for="sr-ro-i">Why is it being reopened? <span class="req">(required)</span></label>' +
                '<input type="text" id="sr-ro-i" autocomplete="off">' +
                /* ⚠ SAY WHERE IT ACTUALLY GOES — 07.3 adversarial fix.
                   This claimed the reason is read by the reporter. It is
                   not: `reopenSupportTicket()` pushes it to the ticket's
                   `history`, and the reporter's Help page renders only
                   `resolutionNote`, and only while the ticket is
                   RESOLVED. After a reopen they see the open state and
                   nothing else. */
                '<p class="hint">Recorded on this report&rsquo;s history <strong>on the platform side</strong>. ' +
                'The reporter sees the report go back to open on their Help page; they are not shown this ' +
                'reason, and nothing is sent to them. Reopening contradicts a resolution somebody already ' +
                'gave, so it still has to say why.</p></div>',
              okLabel: 'Reopen report',
              onConfirm: function (body) {
                var input = body ? body.querySelector('#sr-ro-i') : null;
                var why = String(input ? input.value : '').trim();
                if (!why) {
                  ui.toast('Nothing was changed — a reason is required to reopen a report.', 'info');
                  ui.announce('The report was not reopened. A reason is required.');
                  return;
                }
                state.reopenSupportTicket(t.id, why);
                ui.toast('Report ' + t.id + ' reopened. The reporter can see it is open again.');
                XRSLP.render(false);
              }
            });
          });
        }
      }
    };
  };
})();
