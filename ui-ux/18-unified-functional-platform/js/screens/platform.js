/* ============================================================
   Unified Functional Platform — SUPER ADMIN workspace (part 1 of 3).

   Shared platform helpers · Overview · Access requests · Institutions
   (list + governance detail).

   Content governance and later-version Release / Hold live in
   platform-content.js; role governance and operations (device
   transfers, support, expiry) live in platform-ops.js. Three files,
   ONE workspace: same shell, same navigation, same design system.

   ── WHAT THIS ROLE OWNS (STK31-40) ───────────────────────────
   Tenant requests and approval · tenant creation, governance and
   deactivation · Tenant Admin assignment · what a tenant receives ·
   platform role governance · canonical/master metadata · later-version
   Release / Hold · device-transfer decisions · platform support ·
   licensing/term visibility including the 15-day expiry reminder.

   ── WHAT IT EXPLICITLY DOES NOT DO ───────────────────────────
   First publication of a new Experiment (STK31-06 — the Content
   Manager publishes) · grant or revoke an individual learner
   entitlement (R-05, still refuted) · assign content to learners or
   cohorts (R-06, still refuted) · unpublish or withdraw content
   (R-14, still refuted) · any assessment surface (R-07) · any revenue
   or financial metric (STK31-40 / 42 — explicitly prohibited).

   > The altitude rule: SUPER ADMIN DECIDES WHAT A TENANT MAY USE.
   > THE TENANT ADMIN DECIDES WHICH LEARNER GETS WHAT.
   ============================================================ */

window.XRSLP = window.XRSLP || {};
XRSLP.screens = XRSLP.screens || {};

/* ---------- shared Super Admin helpers ---------- */
XRSLP.platformUI = (function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var util = XRSLP.util;
  var ui = XRSLP.ui;
  var state = XRSLP.state;

  var href = {
    overview:     function () { return '#/platform/overview'; },
    requests:     function () { return '#/platform/requests'; },
    request:      function (id) { return '#/platform/requests/' + encodeURIComponent(id); },
    institutions: function () { return '#/platform/institutions'; },
    institution:  function (id) { return '#/platform/institutions/' + encodeURIComponent(id); },
    content:      function () { return '#/platform/content'; },
    record:       function (id) { return '#/platform/content/' + encodeURIComponent(id); },
    structure:    function () { return '#/platform/structure'; },
    grouping:     function (id) { return '#/platform/structure/programme/' + encodeURIComponent(id); },
    course:       function (id) { return '#/platform/structure/course/' + encodeURIComponent(id); },
    roles:        function () { return '#/platform/roles'; },
    actor:        function (id) { return '#/platform/roles/' + encodeURIComponent(id); },
    operations:   function () { return '#/platform/operations'; },
    transfer:     function (id) { return '#/platform/transfer/' + encodeURIComponent(id); },
    ticket:       function (id) { return '#/platform/support/' + encodeURIComponent(id); }
  };

  /* One stat grid, shared with the Tenant Admin and Faculty overviews —
     the same component, because a number is a number. Every value that
     reaches it is derived from a real record. */
  function statGrid(items) {
    return '<div class="statgrid">' + items.map(function (it) {
      var inner =
        '<div class="s-k">' + esc(it.label) + '</div>' +
        '<div class="s-v tabular">' + esc(String(it.value)) + '</div>' +
        (it.note ? '<div class="s-n">' + esc(it.note) + '</div>' : '');
      if (it.href) {
        return '<a class="stat statlink' + (it.tone ? ' ' + it.tone : '') + '" href="' + it.href + '">' +
          inner + '</a>';
      }
      return '<div class="stat' + (it.tone ? ' ' + it.tone : '') + '">' + inner + '</div>';
    }).join('') + '</div>';
  }

  /* The one attention grammar the operations model asks for — many
     sources, one row shape (`12_SUPPORT_AND_OPERATIONS_MODEL.md` §5).
     Every row carries its own accessible name, and every row leads
     somewhere that can act on it. */
  function attentionList(items, emptyOpts) {
    if (!items.length) {
      return ui.emptyState(emptyOpts || {
        icon: 'check', heading: 'h3',
        title: 'Nothing needs a decision',
        body: 'No request, version, transfer, support report or expiring term is waiting on the platform, and ' +
          'no Experiment is stalled with nobody able to act on it.'
      });
    }
    return '<ul class="attn">' + items.map(function (it) {
      return '<li class="at-row ' + (it.tone || 'info') + '">' +
        '<span class="at-ic">' + ui.ic(it.icon || 'info') + '</span>' +
        '<div class="at-body"><div class="at-t">' + esc(it.title) + '</div>' +
        '<p>' + it.body + '</p></div>' +
        '<a class="btn sm sec" href="' + it.href + '" aria-label="' + esc(it.aria || it.label) + '">' +
        esc(it.label) + '</a></li>';
    }).join('') + '</ul>';
  }

  function tenantBadge(t) {
    var m = state.tenantStatusMeta(t);
    return ui.badge(m.badge, m.icon, m.label);
  }

  /* The expiry line, written once. It states the rule and refuses to
     claim a delivery that has not been designed (STK31-28 / ND-16). */
  function expiryLine(rec) {
    var days = state.accessDaysUntilExpiry(rec);
    if (days == null) { return 'No end date recorded'; }
    if (!state.accessIsLive(rec)) { return 'Term ended ' + util.fmtDate(rec.endsOn); }
    return days + ' ' + util.plural(days, 'day') + ' remaining — ends ' + util.fmtDate(rec.endsOn);
  }

  /* The honest statement about the 15-day reminder. It appears wherever
     the reminder state does, and it is the same sentence every time. */
  function reminderNote() {
    return ui.gapNote('DELIVERY CHANNEL PENDING',
      'A tenant must receive an expiry reminder <strong>15 days before</strong> the access term ends. ' +
      'That requirement is confirmed; the <strong>delivery channel is not</strong>, so this build represents ' +
      'the reminder as an operational due-state here and on the tenant’s own workspace. ' +
      '<strong>No email, SMS, push or notification of any kind has been sent</strong>, and no provider is integrated. ' +
      'There is no automatic renewal, payment or extension.');
  }

  /* ============================================================
     R17 — WHERE THE PRODUCTION CHAIN IS STUCK, AND WHO CANNOT WORK.

     The stakeholder's objection was that the Super Admin could see
     institutions, versions, transfers, support reports and expiring
     terms — and NOTHING AT ALL about a Vendor, an Academic Reviewer or
     a Content Manager in trouble. The resolution surfaces existed
     (the per-record platform override, Role governance) but nothing
     ever told him a problem was there, so "ultimate control" meant
     going looking for it record by record.

     A record is STUCK when the role that holds it at its current stage
     is covered by NOBODY with a live scope: it cannot move, and the
     person who used to move it can no longer even see it as work. That
     is derived on every read from two facts the state layer already
     holds — `CONTENT_STATUS_META[...].holder` says who a record in that
     state is with, `actorsForRecord` says who actually covers it — so
     it can never drift from the assignment rows it describes.

     PUBLISHED has no holder and is never counted: it has left the
     chain, and nothing here may imply an override could reach it.

     ⚠ THIS IS A READ MODEL. It resolves nothing, decides nothing and
     widens nobody's authority. Every row leads to a surface that can
     act — the record's own platform override, or Role governance.
     ============================================================ */
  function blockedRecords() {
    return state.contentRecords().filter(function (rec) {
      var meta = state.contentStatusMeta(rec.status);
      if (!meta || !meta.holder) { return false; }
      return state.actorsForRecord(rec, meta.holder).length === 0;
    });
  }

  /* The same rows in the one attention grammar every other Super Admin
     signal uses, so a content-chain deadlock reads beside an expiring
     term rather than as a separate dialect. */
  function blockedItems() {
    return blockedRecords().map(function (rec) {
      var meta = state.contentStatusMeta(rec.status);
      var roleLabel = state.contentRoleLabel(meta.holder);
      return {
        tone: 'warn', icon: 'alert',
        title: rec.name + ' — nobody can act on it',
        body: 'It sits in <strong>' + esc(meta.label) + '</strong>, which is held by the <strong>' +
          esc(roleLabel) + '</strong>, and <strong>no live scope covers this Experiment in that role</strong>. ' +
          'It cannot move on its own. Assign a scope in <a href="' + href.roles() + '">Role governance</a>, ' +
          'or move the record by platform override on its own page.',
        href: href.record(rec.id), label: 'Resolve',
        aria: 'Resolve the stalled Experiment ' + rec.name
      };
    });
  }

  /* The other half of the same problem, from the person's side: a
     registered Vendor, Academic Reviewer or Content Manager who holds
     no live scope opens their workspace and finds nothing actionable.
     They are usually WHY a record above is stuck. */
  function scopelessActors() {
    var out = [];
    state.CONTENT_ROLE_ORDER.forEach(function (role) {
      state.contentActors(role).forEach(function (a) {
        if (!state.roleAssignments({ actorId: a.id }).length) { out.push(a); }
      });
    });
    return out;
  }

  function scopelessItems() {
    return scopelessActors().map(function (a) {
      return {
        tone: 'warn', icon: 'users',
        title: a.name + ' reaches no content',
        body: 'This ' + esc(state.contentRoleLabel(a.role)) + ' holds <strong>no live scope</strong>, so their ' +
          'workspace shows nothing actionable and no new work can start' +
          (state.actorWasEverSuspended(a.id)
            ? ' &mdash; at least one scope has been withdrawn from them at some point, and that withdrawal is ' +
              'recorded permanently on the scope itself.'
            : '.') +
          ' Everything they have already decided stays in the content history with their name on it.',
        href: href.actor(a.id), label: 'Assign',
        aria: 'Assign a scope to ' + a.name
      };
    });
  }

  return {
    href: href, statGrid: statGrid, attentionList: attentionList,
    tenantBadge: tenantBadge, expiryLine: expiryLine, reminderNote: reminderNote,
    blockedRecords: blockedRecords, blockedItems: blockedItems,
    scopelessActors: scopelessActors, scopelessItems: scopelessItems
  };
})();

(function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var util = XRSLP.util;
  var ui = XRSLP.ui;
  var data = XRSLP.data;
  var state = XRSLP.state;
  var P = XRSLP.platformUI;

  var queueFilter = 'all';

  function detailHref(id) { return P.href.request(id); }

  /* ============================================================
     OVERVIEW — the operational picture.

     Every number below opens something. There is no decorative KPI,
     no sample figure, no derived business metric and no revenue
     anywhere: `STK31-40` / `STK31-42` prohibit the last one outright,
     and `PM-11` is scoped to operational facts the platform holds.
     ============================================================ */
  XRSLP.screens.platformOverview = function () {
    var o = state.platformOverview();

    /* R17 — the content chain's own trouble, counted at the top level
       for the first time. Read the block comment on `P.blockedRecords`
       for why these two figures belong on the Super Admin's landing
       screen rather than only inside Content governance. */
    var blocked = P.blockedItems();
    var scopeless = P.scopelessItems();

    var tiles = P.statGrid([
      { label: 'Requests awaiting a decision', value: o.requestsAwaiting.length,
        tone: o.requestsAwaiting.length ? 'warn' : '', href: P.href.requests(),
        note: o.requestsAwaitingPayment.length
          ? o.requestsAwaitingPayment.length + ' approved, awaiting payment' : 'Institutional access requests' },
      { label: 'Active institutions', value: o.activeTenants.length, href: P.href.institutions(),
        note: o.inactiveTenants.length
          ? o.inactiveTenants.length + ' deactivated' : 'All institutions active' },
      { label: 'Versions awaiting Release / Hold', value: o.versionsAwaiting.length,
        tone: o.versionsAwaiting.length ? 'warn' : '', href: P.href.content(),
        note: o.versionsHeld.length ? o.versionsHeld.length + ' currently on hold' : 'Later versions of published content' },
      { label: 'Device transfers awaiting a decision', value: o.transfersAwaiting.length,
        tone: o.transfersAwaiting.length ? 'warn' : '', href: P.href.operations(),
        note: 'Student device replacement requests' },
      { label: 'Support reports open', value: o.ticketsOpen.length,
        tone: o.ticketsOpen.length ? 'warn' : '', href: P.href.operations(),
        note: 'Reported technical issues' },
      { label: 'Access terms within 15 days', value: o.expiryReminders.length,
        tone: o.expiryReminders.length ? 'warn' : '', href: P.href.operations(),
        note: o.expiredAccess.length ? o.expiredAccess.length + ' already expired' : 'Expiry reminder due' },
      { label: 'Experiments nobody can act on', value: blocked.length,
        tone: blocked.length ? 'warn' : '', href: P.href.content(),
        note: 'Stalled in the content production chain' },
      { label: 'Role holders with no scope', value: scopeless.length,
        tone: scopeless.length ? 'warn' : '', href: P.href.roles(),
        note: 'Vendor · Academic Reviewer · Content Manager' }
    ]);

    /* ---- the attention list: one grammar, many sources ---- */
    var items = [];
    o.requestsAwaiting.forEach(function (r) {
      items.push({
        tone: 'warn', icon: 'doc',
        title: r.institution.name + ' — access request ' + r.id,
        body: r.items.length + ' ' + util.plural(r.items.length, 'experiment') + ' · ' + r.quantity + ' ' +
          util.plural(r.quantity, 'user') + ' · ' + esc((data.term(r.term) || {}).label || r.term) +
          ' · submitted ' + esc(util.fmtDate(r.submittedAt)),
        href: P.href.request(r.id), label: 'Review',
        aria: 'Review access request ' + r.id + ' from ' + r.institution.name
      });
    });
    o.versionsAwaiting.forEach(function (v) {
      var rec = state.contentRecord(v.recordId);
      items.push({
        tone: 'warn', icon: 'layers',
        title: (rec ? rec.name : v.recordId) + ' — version ' + v.versionLabel + ' awaiting Release / Hold',
        body: 'Academically approved' + (v.academicDecisionByName ? ' by ' + esc(v.academicDecisionByName) : '') +
          '. The published version ' + esc(v.replacesVersionLabel || '—') + ' stays live until you release this one.',
        href: P.href.record(v.recordId), label: 'Decide',
        aria: 'Decide Release or Hold for version ' + v.versionLabel + ' of ' + (rec ? rec.name : v.recordId)
      });
    });
    o.transfersAwaiting.forEach(function (r) {
      var t = state.tenantById(r.tenantId);
      items.push({
        tone: 'warn', icon: 'monitor',
        title: r.personName + ' — device replacement request',
        body: (t ? esc(t.name) + ' · ' : '') + 'requested ' + esc(util.fmtDate(r.createdAt)) +
          '. Approving moves the authorised device binding; it grants no content and consumes no licence.',
        href: P.href.transfer(r.id), label: 'Review',
        aria: 'Review device transfer request ' + r.id + ' from ' + r.personName
      });
    });
    o.ticketsOpen.forEach(function (t) {
      var ten = t.tenantId ? state.tenantById(t.tenantId) : null;
      items.push({
        tone: 'warn', icon: 'alertCirc',
        title: t.subject,
        body: esc(state.supportCategoryLabel(t.category)) + ' · reported by ' + esc(t.requesterName) +
          (ten ? ' · ' + esc(ten.name) : '') + ' · ' + esc(util.fmtDate(t.createdAt)),
        href: P.href.ticket(t.id), label: 'Open',
        aria: 'Open support report ' + t.id + ': ' + t.subject
      });
    });
    o.expiryReminders.forEach(function (rec) {
      var t = state.tenantById(rec.tenantId);
      items.push({
        tone: 'warn', icon: 'clock',
        title: (t ? t.name : rec.tenantId) + ' — access term expiring',
        body: esc(rec.id) + ' · ' + esc(P.expiryLine(rec)) +
          '. The tenant must be reminded 15 days ahead; the delivery channel is not selected, ' +
          'so nothing has been sent.',
        href: P.href.institution(rec.tenantId), label: 'Institution',
        aria: 'Open the institution report for ' + (t ? t.name : rec.tenantId)
      });
    });
    o.tenantsWithoutAdmin.forEach(function (t) {
      items.push({
        tone: 'warn', icon: 'users',
        title: t.name + ' — no Tenant Admin assigned',
        body: 'The Super Admin assigns the Tenant / Institute Admin. Until one is assigned, nobody at this ' +
          'institution is recorded as responsible for its people and assignments.',
        href: P.href.institution(t.id), label: 'Assign',
        aria: 'Assign a Tenant Admin for ' + t.name
      });
    });
    /* R17 — the content chain's problems reach the same list as
       everything else. They sit LAST on purpose: a stuck Experiment is
       not more urgent than an institution waiting on a decision, and
       the point of the correction is that the Super Admin is TOLD, not
       that the ordering is rewritten around content. */
    blocked.forEach(function (it) { items.push(it); });
    scopeless.forEach(function (it) { items.push(it); });

    var html =
      ui.phead('Overview',
        items.length
          ? items.length + ' ' + util.plural(items.length, 'item') + ' waiting on the platform'
          : 'Nothing is waiting on the platform') +
      '<div class="stack">' +
      ui.card('Platform at a glance', tiles +
        '<p class="cardfoot">Every figure here is counted from real records and opens the thing it counts. ' +
        'No revenue or financial metric appears on any Super Admin surface.</p>', null, 'h2') +
      ui.card('Needs a decision', P.attentionList(items), null, 'h2') +
      (o.expiryReminders.length ? P.reminderNote() : '') +
      '</div>';

    return { title: 'Overview', html: html, navKey: 'overview' };
  };

  /* ---------------- request queue ---------------- */
  XRSLP.screens.platformRequests = function () {
    var all = state.requests().slice().reverse();
    var submittedCount = all.filter(function (r) { return r.status === state.STATUS.SUBMITTED; }).length;

    var filtered = all.filter(function (r) {
      if (queueFilter === 'all') { return true; }
      return r.status === queueFilter;
    });

    var options = [
      { v: 'all', label: 'All states (' + all.length + ')' },
      { v: state.STATUS.SUBMITTED, label: 'Submitted (' + all.filter(function (r) { return r.status === state.STATUS.SUBMITTED; }).length + ')' },
      { v: state.STATUS.INFO_REQUESTED, label: 'More information requested (' + all.filter(function (r) { return r.status === state.STATUS.INFO_REQUESTED; }).length + ')' },
      { v: state.STATUS.APPROVED_PAYMENT_REQUIRED, label: 'Approved — payment required (' + all.filter(function (r) { return r.status === state.STATUS.APPROVED_PAYMENT_REQUIRED; }).length + ')' },
      { v: state.STATUS.ACTIVE, label: 'Active (' + all.filter(function (r) { return r.status === state.STATUS.ACTIVE; }).length + ')' }
    ].map(function (o) {
      return '<option value="' + esc(o.v) + '"' + (queueFilter === o.v ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('');

    var body;
    if (!all.length) {
      body = ui.emptyState({
        icon: 'doc',
        title: 'No institutional requests yet',
        body: 'Requests submitted from the public catalogue appear here for review. Nothing is awaiting a decision.'
      });
    } else if (!filtered.length) {
      body = ui.emptyState({
        icon: 'search',
        title: 'No requests in this state',
        body: 'No request currently matches the selected state filter.',
        actionsHTML: '<button class="btn sec sm" type="button" id="q-all">Show all states</button>'
      });
    } else {
      var rows = filtered.map(function (r) {
        /* A RENEWAL IS AN ORDINARY REQUEST ROW carrying one extra field,
           and that is deliberate: it comes through this queue, meets the
           same decision surface, the same required reason and the same
           payment route, so no second approval path had to be invented.
           But it is NOT new business — approving it lengthens the term
           of a record the institution already holds — and a reviewer who
           cannot tell the two apart from the list is deciding one thing
           believing it is the other. The row says which it is, and links
           to the institution behind it. */
        var renewal = !!r.renewsAccessId;
        var boundTenant = r.tenantId ? state.tenantById(r.tenantId) : null;
        return '<tr>' +
          '<td data-label="Request"><a class="rowlink" href="' + detailHref(r.id) + '">' +
          '<span class="tmain">' + esc(r.id) + '</span>' +
          '<span class="tsub">Submitted ' + esc(util.fmtDate(r.submittedAt)) + '</span></a>' +
          (renewal
            ? '<span class="tsub">' + ui.badge('b-info', 'calendar', 'Renewal') + '</span>' +
              '<span class="tsub">extends access record ' + esc(r.renewsAccessId) + '</span>'
            : '') + '</td>' +
          '<td data-label="Institution"><span class="tmain" style="font-weight:500">' +
          (renewal && boundTenant
            ? '<a href="' + P.href.institution(boundTenant.id) + '">' + esc(boundTenant.name) + '</a>'
            : esc(r.institution.name)) + '</span>' +
          '<span class="tsub">' + esc(r.institution.kind === 'internal' ? 'Internal' : 'External') + '</span></td>' +
          '<td data-label="Access context">' + esc(r.institution.accessContext) + '</td>' +
          '<td data-label="Users" class="num">' + r.quantity + '</td>' +
          '<td data-label="Term">' + esc((data.term(r.term) || {}).label || r.term) + '</td>' +
          '<td data-label="Experiments" class="num">' + r.items.length + '</td>' +
          '<td data-label="Status">' + ui.statusBadge(r.status) + '</td>' +
          '<td class="cell-actions"><a class="btn sm ' + (r.status === state.STATUS.SUBMITTED ? 'pri' : 'sec') + '" href="' + detailHref(r.id) + '">' +
          (r.status === state.STATUS.SUBMITTED ? 'Review' : 'Open') + '</a></td>' +
          '</tr>';
      }).join('');
      body = '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Institutional access requests</caption>' +
        '<thead><tr><th scope="col">Request</th><th scope="col">Institution</th><th scope="col">Access context</th>' +
        '<th scope="col">Users</th><th scope="col">Term</th><th scope="col">Experiments</th><th scope="col">Status</th>' +
        '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>';
    }

    var html =
      ui.phead('Access requests',
        submittedCount ? submittedCount + ' ' + util.plural(submittedCount, 'request') + ' awaiting a decision' :
          'No requests awaiting a decision') +
      '<div class="tablecard">' +
      '<div class="listbar">' +
      '<label for="q-state">State' +
      '<select id="q-state">' + options + '</select></label>' +
      '<span class="lcount">' + filtered.length + ' of ' + all.length + ' shown</span>' +
      '</div>' +
      body +
      '</div>';

    return {
      title: 'Access requests',
      html: html,
      navKey: 'requests',
      after: function () {
        var sel = document.getElementById('q-state');
        if (sel) {
          sel.addEventListener('change', function () {
            queueFilter = sel.value;
            XRSLP.render(true);
            var again = document.getElementById('q-state');
            if (again) { again.focus(); }
            ui.announce('Request list filtered.');
          });
        }
        var qAll = document.getElementById('q-all');
        if (qAll) {
          qAll.addEventListener('click', function () {
            queueFilter = 'all';
            XRSLP.render(true);
            ui.focusMain(true);
          });
        }
      }
    };
  };

  /* ---------------- request detail + decision ---------------- */
  XRSLP.screens.platformRequestDetail = function (params) {
    var r = state.request(params.id);
    if (!r) {
      return {
        title: 'Request not found',
        navKey: 'requests',
        html: ui.crumbs([{ label: 'Access requests', href: P.href.requests() }, { label: 'Not found' }]) +
          ui.phead('Request not found') +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'alertCirc',
            title: 'Request not found',
            body: 'No institutional request exists with this identifier in the prototype data.',
            actionsHTML: '<a class="btn pri" href="' + P.href.requests() + '">Back to access requests</a>'
          }) + '</div>'
      };
    }

    var termLabel = (data.term(r.term) || {}).label || r.term;

    /* ── WHICH INSTITUTION IS BEHIND THIS REQUEST ────────────────
       Resolved once, at the top, because three separate things now
       depend on the answer: whether approving creates an institution or
       joins one, what that institution ALREADY holds of what is being
       asked for, and — where this is a renewal — which record's term
       moves. Asking the question three times invites the three answers
       to drift apart. */
    /* ⚠ NULL IS A REAL AND CORRECT ANSWER, AND EVERY READER BELOW
       DEPENDS ON IT STAYING THAT WAY. `resolveRequestTenant` no longer
       falls back to the prototype scenario's seeded tenant, so a
       request typed under an institution name the platform does not
       recognise resolves to NOTHING rather than to a bystander
       institution. Three consequences, all deliberate:
         · `held` stays empty, so the "Already held by this institution"
           card is not rendered — it cannot show a stranger's access
           record ids, technologies, terms or licence figures;
         · the identity sentence takes its third branch and says
           approving creates a NEW institution, which is the truth;
         · nothing links to an institution report that has nothing to do
           with this applicant.
       Do not reintroduce a fallback here to make the card "look
       populated": a populated card would be about somebody else. */
    var reqTenant = state.resolveRequestTenant(r);

    /* ── RULE A — THE OVERLAP, READ BEFORE THE DECISION ──────────
       An institution coming back for the same Experiment is buying MORE
       LICENCES on content it already has. That is legitimate and
       confirmed, and nothing here blocks, warns against or discourages
       approving it. What was missing is simply that the reviewer could
       not SEE it: the request looked identical to a first purchase, so
       an expansion and a duplicate were indistinguishable at the moment
       of deciding. One row per existing access record, never blended —
       two records carrying the same Experiment have independent
       technologies, terms and licence counts, and one can expire while
       the other runs. */
    /* ⚠ NEVER THE RECORD THIS REQUEST ITSELF WROTE. Once a request is
       ACTIVE it has an access record of its own, and listing that under
       "Already held by this institution" told the reviewer the
       institution held the thing twice — the exact confusion the card
       exists to remove. Records are matched by `requestId`, which is
       what binds an access record to the request that created it. */
    var held = (reqTenant ? state.heldSelectionFor(reqTenant.id, r.items) : []).map(function (h) {
      return { experimentId: h.experimentId,
               rows: h.rows.filter(function (row) { return row.record.requestId !== r.id; }) };
    }).filter(function (h) { return h.rows.length; });
    var heldLive = held.filter(function (h) {
      return h.rows.some(function (row) { return row.live; });
    }).length;

    /* ── RULE D — IS THIS A RENEWAL? ─────────────────────────────
       A renewal is an ORDINARY requests[] row with one extra field, so
       it reaches this same screen and this same decision. The screen has
       to say so: approving a renewal extends the term of a record the
       institution already holds, and reading it as new business would
       have the reviewer weighing a purchase that is not being made. */
    var renewsRec = r.renewsAccessId ? state.accessById(r.renewsAccessId) : null;

    var itemList = r.items.map(function (item) {
      var ctx = data.contextOf(item.experimentId);
      return '<div class="ri"><div class="ri-body">' +
        '<div class="ri-ctx">' + (ctx ? esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name) : '') + '</div>' +
        '<div class="ri-t">' + esc(ctx ? ctx.experiment.name : item.experimentId) + '</div></div>' +
        '<div class="ri-tech">' + ui.techBadges(item.technologies) + '</div></div>';
    }).join('');

    /* THE NOTE IS RENDERED, not merely stored. STK31-20 requires a
       REASON and a HISTORY TRAIL, and a reason nobody can read is
       neither. This is also the ONLY place the applicant's reply to a
       request for more information reaches the reviewer — it lives on
       the history entry and nowhere else — so omitting it made the
       round trip one-way. The tenant governance timeline already did
       this; the request timelines did not. */
    var timeline = '<div class="timeline">' + r.history.map(function (h, i) {
      var dotCls = i === r.history.length - 1 ?
        (r.status === state.STATUS.ACTIVE ? 'good' : r.status === state.STATUS.APPROVED_PAYMENT_REQUIRED ? 'warn' : 'info') : 'good';
      return '<div class="tl-item"><span class="tl-dot ' + dotCls + '">' + ui.ic(i === 0 ? 'doc' : 'check') + '</span>' +
        '<div class="tl-body"><div class="tl-action">' + esc(h.event) + '</div>' +
        '<div class="tl-who">' + esc(h.who) + ' · ' + esc(util.fmtDateTime(h.at)) + '</div>' +
        (h.note ? '<p class="tl-note">' + esc(h.note) + '</p>' : '') +
        '</div></div>';
    }).join('') + '</div>';

    /* ---- THE DECISION SURFACE — `STK31-20` / `U-SA-05` + `U-SA-08` ----
       Approve · request more information · REASON REQUIRED · history
       trail, and the allocation the tenant actually receives
       (`STK31-24`: the Super Admin controls which Courses, Experiments
       and technology variants an institution gets). The allocation
       controls can only ever narrow the request — the platform never
       hands an institution content it did not ask for. */
    var decideBlock = state.requestDecisionBlock(r);
    var termOptions = ['monthly', 'quarterly', 'yearly'];
    var termIdx = termOptions.indexOf(r.term);

    var decisionHTML = '';
    if (r.status === state.STATUS.SUBMITTED && decideBlock === 'tenant-inactive') {
      var blockedTenant = state.resolveRequestTenant(r);
      decisionHTML =
        '<div class="decidebar"><span class="db-note">' +
        'No decision can be taken: this request would activate onto <strong>' +
        esc(blockedTenant ? blockedTenant.name : 'an institution') + '</strong>, which is currently ' +
        '<strong>deactivated</strong>. Reactivate the institution on its ' +
        '<a href="' + (blockedTenant ? P.href.institution(blockedTenant.id) : P.href.institutions()) +
        '">institution report</a> first. Nothing about this request has changed.' +
        '</span></div>';
    } else if (r.status === state.STATUS.SUBMITTED) {
      var consequence = r.paymentRequired ?
        'External institution (access context “' + r.institution.accessContext + '”): approval moves the request to ' +
        '“Approved — payment required”. Tenant access is activated only after payment completes.' :
        'Internal institution (access context “' + r.institution.accessContext + '”): approval activates tenant access ' +
        'immediately. No payment step exists on this route.';

      var allocRows = r.items.map(function (item, ix) {
        var ctx = data.contextOf(item.experimentId);
        return '<div class="grantrow" data-exp="' + esc(item.experimentId) + '">' +
          '<div class="ri-ctx">' + (ctx ? esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name) : '') + '</div>' +
          '<div class="ri-t">' + esc(ctx ? ctx.experiment.name : item.experimentId) + '</div>' +
          '<div class="granttechs">' + item.technologies.map(function (t, tx) {
            var tid = 'gt-' + ix + '-' + tx;
            return '<label class="chk" for="' + tid + '"><input type="checkbox" id="' + tid +
              '" class="grant-tech" data-exp="' + esc(item.experimentId) + '" value="' + esc(t) + '" checked> ' +
              esc((data.TECHNOLOGIES[t] || {}).label || t) + '</label>';
          }).join('') + '</div></div>';
      }).join('');

      /* WHICH INSTITUTION THIS WILL ACTIVATE ONTO. The institution name
         on a request is free text, so a request either joins an
         institution the platform already knows or creates a new one —
         and that identity decision was previously invisible until after
         it had been taken. The Super Admin can now see it before
         deciding. The lookup itself is unchanged: matching by name is
         what lets a returning institution add a second access record
         rather than becoming a duplicate tenant. */
      var targetTenant = reqTenant;
      /* THE OVERLAP, SAID IN THE SAME BREATH AS THE IDENTITY. Both
         answer one question — "what is this institution's position
         before I decide?" — so separating them would make the reviewer
         assemble the answer themselves. It counts and never judges: an
         expansion is confirmed business, and no wording here argues
         against approving one. */
      var overlapLine = held.length
        ? ' <strong>' + held.length + ' of the ' + r.items.length + ' requested ' +
          util.plural(r.items.length, 'experiment') + '</strong> ' +
          (held.length === 1 ? 'already appears' : 'already appear') + ' on an access record this institution ' +
          'holds, so this is an <strong>expansion</strong> of existing access rather than a first purchase. ' +
          'That is legitimate; the existing records are set out below so you can see the overlap.'
        : '';
      var identityLine;
      if (r.renewsAccessId) {
        identityLine = 'This is a <strong>renewal</strong> of access record ' + esc(r.renewsAccessId) +
          (targetTenant ? ', held by ' + esc(targetTenant.name) : '') +
          '. Approving it <strong>extends that record&rsquo;s term</strong>: no second institution, no second ' +
          'access record and no additional licence is created' +
          (r.paymentRequired
            ? ', and the term moves only once the institution completes the same payment step it was onboarded ' +
              'through.'
            : ', and the term moves at once because this institution&rsquo;s route carries no payment step.');
      } else if (targetTenant) {
        identityLine = 'This attaches to the <strong>existing</strong> institution ' + esc(targetTenant.name) +
          ' — no second institution is created' +
          (r.paymentRequired
            ? ', and an access record is added beside what it already holds once payment completes.'
            : ', and an access record is added beside what it already holds.') + overlapLine;
      } else {
        identityLine = 'No institution on the platform matches this name, so approving creates a <strong>new</strong> ' +
          'institution called ' + esc(r.institution.name) + ' straight away' +
          (r.paymentRequired
            ? ' — you can assign its Tenant Admin immediately, and it receives the approved content when ' +
              'payment completes.'
            : ', and activates its access at the same moment.');
      }

      decisionHTML =
        '<form class="decideform" id="req-decide" novalidate>' +
        '<h3 style="font-size:13.5px;font-weight:640;margin:18px 0 2px">Decision</h3>' +
        '<p class="muted" style="margin:0 0 10px">' + esc(consequence) + '</p>' +
        '<p class="muted" style="margin:0 0 10px">' + identityLine + '</p>' +
        '<div class="form-errors"></div>' +
        /* ── A RENEWAL CARRIES NO GRANT EDITOR ────────────────────────
           A renewal mirrors a plan that already exists, and whether a
           renewal may change licences, technologies or term is an OPEN
           question. Offering the narrowing control here promised
           something the activation could not deliver: it extends the
           TERM of an existing record rather than writing a new one, so
           a narrowed licence count or technology set would have been
           announced to the institution and then silently ignored.
           `state.approveRequest` refuses a grant on a renewal, so the
           control is not merely hidden — it has nothing to submit to. */
        (r.renewsAccessId
          ? '<div class="grantbox-off"><p class="muted" style="margin:0">' +
            '<strong>The plan is not adjustable on a renewal.</strong> A renewal continues exactly what ' +
            'the institution holds — the same experiments, the same technologies, the same licence count ' +
            'and the same term length. To give this institution something different, ask them to raise an ' +
            'ordinary institutional access request. Whether a renewal should be able to change any of ' +
            'this is not yet settled.</p></div>'
          : '<details class="grantbox"><summary>What this institution will receive ' +
        '<span class="muted">— adjust only if it should get less than it asked for</span></summary>' +
        '<div class="grantbody">' +
        '<p class="muted">Everything requested is granted by default. Clearing a technology or lowering a ' +
        'figure narrows what the institution receives; nothing here can grant more than was requested.</p>' +
        '<div id="grant-items" class="field">' + allocRows + '</div>' +
        '<div class="frow">' +
        '<div class="field" id="grant-quantity"><label for="gq">Approved users / licences</label>' +
        '<input type="number" id="gq" min="1" step="1" max="' + r.quantity + '" value="' + r.quantity + '">' +
        '<div class="fhint">' + r.quantity + ' requested. Cannot be increased here.</div></div>' +
        '<div class="field" id="grant-term"><label for="gt">Approved access term</label>' +
        '<select id="gt">' + termOptions.slice(0, termIdx + 1).map(function (t) {
          return '<option value="' + esc(t) + '"' + (t === r.term ? ' selected' : '') + '>' +
            esc((data.term(t) || {}).label || t) + '</option>';
        }).join('') + '</select>' +
        '<div class="fhint">' + esc(termLabel) + ' requested. Cannot be extended here.</div></div>' +
        '</div></div></details>') +
        '<div class="field" id="decision-reason">' +
        '<label for="dr">Reason for this decision <span class="req">(required)</span></label>' +
        '<textarea id="dr" rows="3" placeholder="The institution reads this on their own request status screen."></textarea>' +
        '<div class="fhint">Recorded on the request history and shown to the applicant, for either outcome.</div>' +
        '</div>' +
        '<div class="formact">' +
        '<button class="btn pri" type="button" id="req-approve">' + ui.ic('check') + 'Approve request</button>' +
        '<button class="btn sec" type="button" id="req-moreinfo">' + ui.ic('clock') + 'Request more information</button>' +
        '</div>' +
        '</form>';
    } else if (r.status === state.STATUS.INFO_REQUESTED) {
      decisionHTML =
        '<div class="decidebar"><span class="db-note">More information has been requested from the institution. ' +
        'The request is not approved and not refused — it returns to this queue when they resubmit. ' +
        (r.renewsAccessId
          ? 'Nothing has been extended: access record ' + esc(r.renewsAccessId) + ' still runs to whatever end ' +
            'date it already had.'
          : 'Nothing has been activated and no entitlement exists.') +
        (r.decisionReason ? '<br><strong>Reason sent:</strong> ' + esc(r.decisionReason) : '') +
        '</span></div>';
    } else if (r.status === state.STATUS.APPROVED_PAYMENT_REQUIRED) {
      /* A RENEWAL AT THIS STAGE IS NOT AN INSTITUTION WITHOUT ACCESS.
         The unqualified sentence — "tenant access is not active yet" —
         is true of a first purchase and plainly false of a renewal,
         where the institution is using the record right now and only
         the extension is pending. */
      decisionHTML =
        '<div class="decidebar"><span class="db-note">' +
        (r.renewsAccessId
          ? 'Approved. Awaiting payment from the institution through the same payment step it was onboarded ' +
            'through. Access record ' + esc(r.renewsAccessId) + ' is <strong>unchanged</strong> in the ' +
            'meantime — it still runs to its existing end date, and the term is extended only when payment ' +
            'completes.'
          : 'Approved. Awaiting payment from the institution — tenant access is not active yet and no ' +
            'entitlement exists.') +
        '</span></div>';
    } else if (r.status === state.STATUS.ACTIVE) {
      var tenant = r.tenantId ? state.tenantById(r.tenantId) : null;
      decisionHTML =
        '<div class="decidebar"><span class="db-note">' +
        (r.renewsAccessId
          ? 'Renewal activated. Access record ' + esc(r.renewsAccessId) + '&rsquo;s term was extended' +
            (renewsRec && renewsRec.endsOn ? ' and now runs to ' + esc(util.fmtDate(renewsRec.endsOn)) : '') +
            '. No second access record was created.'
          : 'Access is active' + (tenant ? ' for ' + esc(tenant.name) : '') + '.') +
        ' The tenant&rsquo;s approved content, licences and term are ' +
        'on its <a href="' + (tenant ? P.href.institution(tenant.id) : P.href.institutions()) +
        '">institution report</a>.</span></div>';
    }

    /* RULE A — the overlap card. It is a READ MODEL and only a read
       model: it decides nothing, blocks nothing and recommends nothing.
       Every figure on it comes from the access records themselves. */
    var heldCard = (reqTenant && held.length)
      ? '<section class="card"><div class="chead"><h2>Already held by this institution</h2></div>' +
        '<div class="cbody">' +
        '<p class="muted" style="margin:0 0 10px">' + esc(reqTenant.name) + ' already has an access record ' +
        'covering <strong>' + held.length + '</strong> of the ' + r.items.length + ' ' +
        util.plural(r.items.length, 'experiment') + ' requested here' +
        (heldLive < held.length
          ? ' — ' + heldLive + ' of them under a record whose term is still running. Records whose term has ' +
            'ended are listed too, because they are real history.'
          : '.') +
        '</p>' +
        '<div class="reqitems">' + held.map(function (h) {
          var ctx = data.contextOf(h.experimentId);
          return '<div class="ri"><div class="ri-body">' +
            '<div class="ri-ctx">' + (ctx ? esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name) : '') + '</div>' +
            '<div class="ri-t">' + esc(ctx ? ctx.experiment.name : h.experimentId) + '</div>' +
            '<ul class="reslist plain" style="margin-top:8px">' + h.rows.map(function (row) {
              var al = row.allocation;
              return '<li>' + ui.ic('layers') + '<span>' +
                '<strong>' + esc(row.record.id) + '</strong> ' + ui.termBadge(row.termState) +
                (row.record.id === r.renewsAccessId
                  ? ' ' + ui.badge('b-info', 'calendar', 'The record this request renews')
                  : '') +
                '<span class="tsub2">' + ui.techBadges(row.technologies) + '</span>' +
                '<span class="tsub2">' + esc(P.expiryLine(row.record)) + '</span>' +
                '<span class="tsub2">' + al.approved + ' approved ' + util.plural(al.approved, 'licence') +
                ' · ' + al.assigned + ' assigned · ' + al.remaining + ' remaining' +
                (al.over ? ' · ' + al.over + ' held beyond the allocation' : '') + '</span>' +
                (row.assignable
                  ? ''
                  : '<span class="tsub2">Not assignable at the moment — ' +
                    esc(state.assignabilityText(row.reason)) + '</span>') +
                '</span></li>';
            }).join('') + '</ul></div></div>';
        }).join('') + '</div>' +
        '<p class="cardfoot">Licence figures are <strong>per record</strong> and are allocation figures, not ' +
        'student counts. Records are listed separately rather than blended into one &ldquo;current plan&rdquo;: ' +
        'two records carrying the same experiment have independent technologies, terms and licence quantities, ' +
        'and one can expire while the other is still running, so a combined figure would be true of neither. ' +
        'Nothing on this card blocks or discourages approving the request.</p>' +
        '</div></section>'
      : '';

    /* RULE D — the renewal banner. Stated at the top of the screen and
       not only inside the decision block, because the request keeps
       being a renewal after it has been decided, and somebody reading
       an approved one later needs the same fact. */
    var renewalAlert = r.renewsAccessId
      ? ui.alertBox('info', 'This is a renewal, not new business',
          '<p>Request <strong>' + esc(r.id) + '</strong> renews access record <strong>' +
          esc(r.renewsAccessId) + '</strong>' +
          (reqTenant
            ? ', held by <a href="' + P.href.institution(reqTenant.id) + '">' + esc(reqTenant.name) + '</a>'
            : '') + '. Approving it <strong>extends that record&rsquo;s term</strong> rather than creating a ' +
          'new one: the record keeps its id, and every assignment, faculty mapping and licence allocation ' +
          'already pointing at it stays exactly where it is.</p>' +
          '<p style="margin-top:8px">The plan below <strong>mirrors that record exactly</strong> — the same ' +
          'experiments, the same technologies, the same licence quantity and the same term, copied from the ' +
          'record. ' +
          (r.paymentRequired
            ? 'This institution came in on the <strong>' + esc(r.institution.accessContext) + '</strong> route, ' +
              'so the renewal goes through the <strong>same payment step it was onboarded through</strong>; ' +
              'approving moves it to &ldquo;Approved — payment required&rdquo; and the term moves only when ' +
              'payment completes.'
            : 'This institution came in on the <strong>' + esc(r.institution.accessContext) + '</strong> route, ' +
              'which carries <strong>no payment step</strong>, so approving extends the term immediately.') +
          '</p>' +
          (renewsRec
            ? '<p style="margin-top:8px">That record&rsquo;s term currently ends <strong>' +
              esc(util.fmtDate(renewsRec.endsOn)) + '</strong>.</p>'
            : '<p style="margin-top:8px">That access record is <strong>no longer on the platform</strong>, so ' +
              'there is nothing for an approval to extend. Nothing has been changed by saying so.</p>'))
      : '';

    var html =
      ui.crumbs([{ label: 'Access requests', href: P.href.requests() }, { label: r.id }]) +
      ui.phead('Request ' + r.id, esc(r.institution.name) + ' · submitted ' + esc(util.fmtDate(r.submittedAt)),
        null, ui.statusBadge(r.status) +
        (r.renewsAccessId ? ' ' + ui.badge('b-info', 'calendar', 'Renewal') : '')) +
      renewalAlert +
      '<div class="grid-rail">' +
      '<div class="stack">' +
      '<section class="card">' +
      '<div class="chead"><h2>Institution</h2></div>' +
      '<div class="cbody"><div class="kv">' +
      '<div class="k">Institution</div><div class="v">' + esc(r.institution.name) + '</div>' +
      '<div class="k">Classification</div><div class="v">' + esc(r.institution.kind === 'internal' ? 'Internal (prototype seed)' : 'External (prototype seed)') + '</div>' +
      '<div class="k">Access context</div><div class="v">' + esc(r.institution.accessContext) + '</div>' +
      '<div class="k">Contact (SPOC)</div><div class="v">' + esc(r.institution.contactName) + ' · ' + esc(r.institution.contactEmail) + '</div>' +
      '<div class="k">Payment</div><div class="v">' + (r.paymentRequired ? 'Required after approval' : 'Not required — no payment step on this route') + '</div>' +
      '</div></div></section>' +
      '<section class="card">' +
      '<div class="chead"><h2>Requested access</h2></div>' +
      '<div class="cbody"><div class="kv">' +
      '<div class="k">Users / licences</div><div class="v">' + r.quantity + '</div>' +
      '<div class="k">Access term</div><div class="v">' + esc(termLabel) + '</div>' +
      '<div class="k">Experiments</div><div class="v">' + r.items.length + '</div>' +
      (r.renewsAccessId
        ? '<div class="k">Renews</div><div class="v">' + esc(r.renewsAccessId) +
          (reqTenant
            ? ' <span class="muted">· <a href="' + P.href.institution(reqTenant.id) + '">' +
              esc(reqTenant.name) + '</a></span>'
            : '') +
          (renewsRec
            ? ' <span class="muted">· term currently ends ' + esc(util.fmtDate(renewsRec.endsOn)) + '</span>'
            : ' <span class="muted">· that record is no longer on the platform</span>') +
          '<div class="tsub2">Approving extends this record&rsquo;s term. The figures above are copied from ' +
          'it and are not editable — whether a renewal may change the plan is not settled.</div></div>'
        : '') +
      '</div>' +
      '<h3 style="font-size:13.5px;font-weight:640;margin:14px 0 4px">Selected content &amp; technologies</h3>' +
      '<div class="reqitems">' + itemList + '</div>' +
      '</div>' +
      decisionHTML +
      '</section>' +
      heldCard +
      '</div>' +
      '<div class="stack">' +
      ui.card('History', timeline) +
      ui.gapNote('NOT IN THIS BUILD',
        'A request cannot be refused outright. The two outcomes the sources confirm — approve, and ' +
        'request more information — are both built; a rejection state is not, because no source ' +
        'defines one. Absent capabilities are shown as gaps, never as disabled controls.') +
      '</div>' +
      '</div>';

    return {
      title: 'Request ' + r.id,
      html: html,
      navKey: 'requests',
      after: function () {
        var form = document.getElementById('req-decide');
        if (!form) { return; }

        /* Reads the allocation controls back into the shape
           `state.validateGrant` checks. Returns null when nothing was
           narrowed, so an untouched decision approves the request
           exactly as submitted. */
        function readGrant() {
          /* A renewal renders no grant editor at all, so there is
             nothing to read and nothing to narrow — and the state layer
             refuses a grant on one either way. Reaching for `#gq` here
             would throw on the very first renewal decision. */
          if (r.renewsAccessId || !form.querySelector('#gq')) { return null; }
          var items = r.items.map(function (item) {
            var boxes = Array.prototype.slice.call(
              form.querySelectorAll('.grant-tech[data-exp="' + item.experimentId + '"]'));
            return {
              experimentId: item.experimentId,
              technologies: boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; })
            };
          }).filter(function (g) { return g.technologies.length; });
          var qty = Number(form.querySelector('#gq').value);
          var term = form.querySelector('#gt').value;
          var untouched = qty === r.quantity && term === r.term &&
            items.length === r.items.length &&
            r.items.every(function (i) {
              var got = items.filter(function (x) { return x.experimentId === i.experimentId; })[0];
              return got && got.technologies.length === i.technologies.length;
            });
          return untouched ? null : { items: items, quantity: qty, term: term };
        }

        function reason() { return String(form.querySelector('#dr').value || '').trim(); }

        function reasonErrors() {
          return reason() ? [] : [{ field: 'decision-reason', message: 'Enter the reason for this decision.' }];
        }

        document.getElementById('req-approve').addEventListener('click', function () {
          var grant = readGrant();
          var errs = reasonErrors().concat(state.validateGrant(r, grant).errors);
          if (!ui.showErrors(form, errs, 'This decision cannot be recorded yet')) { return; }
          var checked = state.validateGrant(r, grant).grant;
          function techTotal(items) {
            return items.reduce(function (n, i) { return n + i.technologies.length; }, 0);
          }
          var askedTech = techTotal(r.items);
          var expCount = checked ? checked.items.length : r.items.length;
          var techCount = checked ? techTotal(checked.items) : askedTech;
          var qty = checked ? checked.quantity : r.quantity;
          var trm = (data.term(checked ? checked.term : r.term) || {}).label || r.term;
          /* NAME ONLY THE DIMENSIONS THAT ACTUALLY CHANGED. The sentence
             used to list experiments, licences and term — so a grant that
             dropped only a TECHNOLOGY announced "less" beside three
             figures that were all identical, and read like a bug. */
          var deltas = [];
          if (expCount !== r.items.length) {
            deltas.push(expCount + ' of ' + r.items.length + ' ' + util.plural(r.items.length, 'experiment'));
          }
          if (techCount !== askedTech) {
            deltas.push(techCount + ' of ' + askedTech + ' technology ' + util.plural(askedTech, 'variant'));
          }
          if (qty !== r.quantity) {
            deltas.push(qty + ' of ' + r.quantity + ' ' + util.plural(r.quantity, 'licence'));
          }
          if (checked && checked.term !== r.term) {
            deltas.push(esc(trm) + ' instead of ' +
              esc((data.term(r.term) || {}).label || r.term));
          }
          var narrowLine = deltas.length
            ? '<div class="consequence">' + ui.ic('alertCirc') + '<span>The institution receives <strong>less</strong> ' +
              'than it requested — ' + deltas.join(', ') + '. The reason is shown to them.</span></div>'
            : '<div class="consequence">' + ui.ic('check') + '<span>The institution receives exactly what it ' +
              'requested: ' + r.items.length + ' ' + util.plural(r.items.length, 'experiment') + ', ' +
              askedTech + ' technology ' + util.plural(askedTech, 'variant') + ', ' +
              r.quantity + ' ' + util.plural(r.quantity, 'licence') + ', ' + esc(trm) + '.</span></div>';
          var routeLine = r.paymentRequired
            ? '<div class="consequence">' + ui.ic('card') + '<span>External route: the request moves to ' +
              '<strong>Approved — payment required</strong>. Tenant access activates only after payment completes.</span></div>'
            : '<div class="consequence">' + ui.ic('check') + '<span>Internal route (' + esc(r.institution.accessContext) + '): ' +
              'tenant access activates <strong>immediately</strong> — there is no payment step.</span></div>';
          /* A RENEWAL AND A PURCHASE HAVE DIFFERENT CONSEQUENCES, so the
             dialog cannot state one sentence for both. "Activation
             entitles no student" is true of new access and misleading of
             a renewal, where extending the term restores effectiveness
             for students who were already assigned under that record. */
          var renewalLine = r.renewsAccessId
            ? '<div class="consequence">' + ui.ic('calendar') + '<span>This is a <strong>renewal</strong>: ' +
              'activation extends the term of access record <strong>' + esc(r.renewsAccessId) + '</strong>. ' +
              'No second access record is written and no additional licence is issued.</span></div>' +
              '<div class="consequence">' + ui.ic('alertCirc') + '<span>It entitles <strong>no new ' +
              'student</strong>. Students already assigned under that record simply continue — or resume, if ' +
              'the term had ended — for the extended term.</span></div>'
            : '<div class="consequence">' + ui.ic('alertCirc') + '<span>Activation entitles ' +
              '<strong>no student</strong>. The Tenant Admin still has to assign the content.</span></div>';
          ui.openDialog({
            title: 'Approve request ' + r.id + '?',
            bodyHTML:
              '<p>Approve institutional request <strong>' + esc(r.id) + '</strong> from <strong>' +
              esc(r.institution.name) + '</strong>?</p>' +
              '<div class="consequence">' + ui.ic('building') + '<span>' + identityLine + '</span></div>' +
              narrowLine + routeLine + renewalLine,
            okLabel: 'Approve',
            onConfirm: function () {
              var updated = state.approveRequest(r.id, { reason: reason(), grant: grant });
              if (updated) {
                ui.toast('Request ' + updated.id + ' approved' +
                  (updated.status === state.STATUS.ACTIVE ? ' — tenant access activated.' : ' — awaiting payment.'));
              }
              XRSLP.render(false);
            }
          });
        });

        document.getElementById('req-moreinfo').addEventListener('click', function () {
          if (!ui.showErrors(form, reasonErrors(), 'This decision cannot be recorded yet')) { return; }
          ui.openDialog({
            title: 'Request more information on ' + r.id + '?',
            bodyHTML:
              '<p>Return request <strong>' + esc(r.id) + '</strong> to <strong>' + esc(r.institution.name) +
              '</strong> for more information?</p>' +
              '<div class="consequence">' + ui.ic('clock') + '<span>The request is <strong>not</strong> approved and ' +
              '<strong>not</strong> refused. Nothing is activated, no access record is created and no student is ' +
              'entitled. It returns to this queue when the institution resubmits.</span></div>' +
              '<div class="consequence">' + ui.ic('doc') + '<span>Your reason is recorded on the history and is ' +
              'shown to the applicant on their request status screen. <strong>Nothing is sent</strong> — there is no ' +
              'email, SMS or notification provider in this build.</span></div>',
            okLabel: 'Request more information',
            onConfirm: function () {
              var updated = state.requestMoreInformation(r.id, reason());
              if (updated) { ui.toast('More information requested on ' + updated.id + '.'); }
              XRSLP.render(false);
            }
          });
        });
      }
    };
  };

  /* ---------------- institutions (tenants) ---------------- */
  XRSLP.screens.platformInstitutions = function () {
    var tenants = state.tenants();
    var inactive = tenants.filter(function (t) { return t.status === 'inactive'; }).length;

    /* An institution provisioned by an approved EXTERNAL request holds
       nothing until payment activates its access. It genuinely exists —
       `STK31-21` makes creating the tenant and assigning its Tenant
       Admin acts of approval, distinct from allocating content — so it
       belongs in this list; but the list must not read it as an
       ordinary tenant with an empty allocation. */
    var awaiting = tenants.filter(function (t) { return !!state.tenantAwaitingActivation(t.id); }).length;

    var rows = tenants.map(function (t) {
      var access = state.accessForTenant(t.id);
      var live = access.filter(state.accessIsLive).length;
      var admins = state.tenantAdminsFor(t.id);
      var due = state.tenantAccessNeedingExpiryReminder(t.id).length;
      var pending = state.tenantAwaitingActivation(t.id);
      return '<tr>' +
        /* R20 — the subline used to print the stored `origin` string,
           which on the sample institution reads "Seeded prototype
           tenant". That is prototype bookkeeping, not something an
           operator reads a tenant list for, and the stakeholder asked
           for it out of the product surface. The provenance is NOT
           deleted — the institution report says how the institution was
           added, in a sentence written for a person — and the space is
           given to the access context, which is a real operational
           attribute the list did not show anywhere. */
        '<td data-label="Institution"><a class="rowlink" href="' + P.href.institution(t.id) + '">' +
        '<span class="tmain">' + esc(t.name) + '</span>' +
        '<span class="tsub">' + esc(t.accessContext) + '</span></a></td>' +
        '<td data-label="Classification">' + esc(t.kind === 'internal' ? 'Internal' : 'External') + '</td>' +
        '<td data-label="Tenant Admin">' + (admins.length
          ? esc(admins[0].name) + (admins.length > 1 ? ' <span class="muted">+' + (admins.length - 1) + '</span>' : '')
          : '<span class="muted">Not assigned</span>') + '</td>' +
        '<td data-label="Access records" class="num">' + (pending
          ? '<span class="muted">None yet</span>'
          : live + ' <span class="muted">of ' + access.length + ' live</span>') + '</td>' +
        '<td data-label="Expiry attention" class="num">' + (due ? due : '<span class="muted">—</span>') + '</td>' +
        '<td data-label="Status">' + P.tenantBadge(t) +
        (pending ? ' ' + ui.badge('b-warning', 'card', 'Awaiting payment') : '') + '</td>' +
        '<td class="cell-actions"><a class="btn sm sec" href="' + P.href.institution(t.id) + '">Open</a></td>' +
        '</tr>';
    }).join('');

    var html =
      ui.phead('Institutions',
        tenants.length + ' ' + util.plural(tenants.length, 'tenant') + ' on the platform' +
        (awaiting ? ' · ' + awaiting + ' awaiting payment' : '') +
        (inactive ? ' · ' + inactive + ' deactivated' : '')) +
      (awaiting
        ? ui.alertBox('info', awaiting + ' ' + util.plural(awaiting, 'institution') + ' ' +
            (awaiting === 1 ? 'exists' : 'exist') + ' but hold' + (awaiting === 1 ? 's' : '') + ' no content yet',
            '<p>Approving an external request <strong>creates the institution</strong> — so its Tenant Admin can be ' +
            'assigned and its identity exists — but the approved content, technologies, licences and term are ' +
            'written only when payment completes. Until then the institution holds <strong>no access record</strong>, ' +
            'nothing can be assigned inside it, and no student is entitled.</p>')
        : '') +
      '<div class="tablecard"><div class="tscroll">' +
      '<table class="dt"><caption class="sr-only">Platform tenants</caption>' +
      '<thead><tr><th scope="col">Institution</th><th scope="col">Classification</th><th scope="col">Tenant Admin</th>' +
      '<th scope="col">Access records</th><th scope="col">Expiring within 15 days</th><th scope="col">Status</th>' +
      '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div></div>' +
      '<div style="margin-top:16px">' +
      ui.gapNote('NOT IN THIS BUILD',
        'An institution is created here only by approving an institutional access request — on either route, at ' +
        'the moment of approval. Creating one outside that route, and the on-campus / off-campus categorisation ' +
        'attribute, are not built: the topology permits a campus to be its own tenant, but no source describes ' +
        'the creation form.') +
      '</div>';

    return { title: 'Institutions', html: html, navKey: 'institutions' };
  };

  /* ============================================================
     INSTITUTION DETAIL — the tenant report and its governance.

     Operational facts only (STK31-42): identity, Tenant Admin, active
     access, licence quantities, term, people counts, the courses and
     experiments actually reached, expiry attention and support signals.
     No revenue metric exists here and none may be invented.
     ============================================================ */
  XRSLP.screens.platformInstitution = function (params) {
    var rep = state.tenantReport(params.id);
    if (!rep) {
      return {
        title: 'Institution not found', navKey: 'institutions',
        html: ui.crumbs([{ label: 'Institutions', href: P.href.institutions() }, { label: 'Not found' }]) +
          ui.phead('Institution not found') +
          '<div class="tablecard">' + ui.emptyState({
            icon: 'alertCirc', title: 'Institution not found',
            body: 'No tenant exists with this identifier in the prototype data.',
            actionsHTML: '<a class="btn pri" href="' + P.href.institutions() + '">Back to institutions</a>'
          }) + '</div>'
      };
    }
    var t = rep.tenant;
    var inactive = t.status === 'inactive';
    /* The approved-but-unpaid external request that created this
       institution, if that is why it exists and holds nothing yet. */
    var awaitingReq = state.tenantAwaitingActivation(t.id);

    /* ---- identity ---- */
    /* R20 — "What is this origin? ... I have to remove it".
       The stored `origin` string was printed raw under a literal
       "Origin" label, so an operator read "Seeded prototype tenant" on
       the institution report. The FACT is worth keeping — how an
       institution came onto the platform is real governance history,
       and it is the only place the originating request is named — so it
       is rephrased rather than deleted, under a label that asks a
       question a person would actually ask, and keyed on `createdOn`,
       which only a real provisioning writes. */
    var addedReq = state.originRequestFor(t.id);
    var addedLine = t.createdOn
      ? 'Created on the platform ' + esc(util.fmtDate(t.createdOn)) +
        (addedReq
          ? ', by approving access request <a href="' + P.href.request(addedReq.id) + '">' +
            esc(addedReq.id) + '</a>.'
          : '. No originating request is on the platform any more.')
      : 'Part of the sample data this prototype starts with. No institutional access request created it, and ' +
        'no real institution is named anywhere in this build.';
    var identity = ui.card('Institution',
      '<div class="kv">' +
      '<div class="k">Name</div><div class="v">' + esc(t.name) + '</div>' +
      '<div class="k">Classification</div><div class="v">' + esc(t.kind === 'internal' ? 'Internal' : 'External') + '</div>' +
      '<div class="k">Access context</div><div class="v">' + esc(t.accessContext) + '</div>' +
      '<div class="k">How this institution was added</div><div class="v">' + addedLine + '</div>' +
      '<div class="k">Status</div><div class="v">' + P.tenantBadge(t) +
      (inactive && t.deactivatedAt ? ' <span class="muted">since ' + esc(util.fmtDate(t.deactivatedAt)) + '</span>' : '') +
      '</div>' +
      (inactive && t.deactivatedReason
        ? '<div class="k">Reason recorded</div><div class="v">' + esc(t.deactivatedReason) + '</div>' : '') +
      '</div>', null, 'h2');

    /* ---- Tenant Admin ---- */
    var adminRows = rep.admins.length
      ? '<ul class="reslist plain">' + rep.admins.map(function (a) {
          return '<li>' + ui.ic('users') +
            '<span><strong>' + esc(a.name) + '</strong> <span class="muted">· ' + esc(a.email) + '</span>' +
            '<span class="tsub">Assigned by ' + esc(a.assignedBy) +
            (a.assignedAt ? ' · ' + esc(util.fmtDate(a.assignedAt)) : '') + '</span></span>' +
            '<button class="btn sm sec" type="button" data-rm-admin="' + esc(a.id) + '">Remove</button></li>';
        }).join('') + '</ul>'
      : ui.alertBox('warning', 'No Tenant Admin assigned',
          '<p>The Super Admin assigns the Tenant / Institute Admin. Until one is assigned, no person is recorded ' +
          'as responsible for this institution&rsquo;s people, groups and assignments.</p>');

    var removedAdmins = rep.allAdmins.filter(function (a) { return a.status === 'removed'; });
    var adminCard = ui.card('Tenant Admin',
      adminRows +
      '<form id="ta-form" novalidate style="margin-top:14px">' +
      '<div class="form-errors"></div>' +
      '<div class="field" id="ta-name"><label for="ta-name-i">Assign a Tenant Admin — name ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<input type="text" id="ta-name-i" autocomplete="off"></div>' +
      '<div class="field" id="ta-email"><label for="ta-email-i">Email ' +
      '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
      '<input type="email" id="ta-email-i" autocomplete="off"></div>' +
      '<div class="formact"><button class="btn pri" type="submit">Assign Tenant Admin</button>' +
      '<span class="formnote">This records the assignment against a named person. It creates no account, ' +
      'sends no invitation and issues no credential — how an identity first exists is not decided by any ' +
      'source, so nothing is invented here.</span></div>' +
      '</form>' +
      (removedAdmins.length
        ? '<p class="cardfoot">Previously assigned: ' + removedAdmins.map(function (a) {
            return esc(a.name) + ' (removed ' + esc(util.fmtDate(a.removedAt)) + ')';
          }).join(', ') + '</p>'
        : ''), null, 'h2');

    /* ---- content access + licences + term ---- */
    var accessRows = rep.access.length
      ? '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Content access records held by ' + esc(t.name) + '</caption>' +
        '<thead><tr><th scope="col">Record</th><th scope="col">Experiments</th><th scope="col">Approved users</th>' +
        '<th scope="col">Assigned</th><th scope="col">Term</th><th scope="col">State</th></tr></thead><tbody>' +
        rep.access.map(function (rec) {
          var al = state.accessAllocation(rec.id);
          var term = state.accessTermState(rec);
          var due = state.expiryReminderDue(rec);
          return '<tr>' +
            '<td data-label="Record"><span class="tmain">' + esc(rec.id) + '</span>' +
            '<span class="tsub">' + esc(rec.accessContext) + '</span></td>' +
            '<td data-label="Experiments" class="num">' + rec.items.length + '</td>' +
            '<td data-label="Approved users" class="num">' + al.approved + '</td>' +
            '<td data-label="Assigned" class="num">' + al.assigned +
            (al.over ? ' <span class="muted">(' + al.over + ' held)</span>' : '') + '</td>' +
            '<td data-label="Term">' + esc(P.expiryLine(rec)) + '</td>' +
            '<td data-label="State">' + ui.termBadge(term) +
            (due ? ' ' + ui.badge('b-warning', 'clock', 'Reminder due') : '') + '</td>' +
            '</tr>';
        }).join('') + '</tbody></table></div>'
      : ui.emptyState(awaitingReq
          ? { icon: 'card', heading: 'h3',
              title: 'Awaiting payment — no access record yet',
              body: 'Request ' + awaitingReq.id + ' has been approved, which is what created this institution. ' +
                'The approved content, technologies, licence quantity and access term are written only when ' +
                'payment completes. Until then this institution holds nothing: nothing can be assigned inside ' +
                'it, no student is entitled, and no Faculty member reaches any content.',
              actionsHTML: '<a class="btn sec" href="' + P.href.request(awaitingReq.id) + '">Open request ' +
                esc(awaitingReq.id) + '</a>' }
          : { icon: 'layers', heading: 'h3',
              title: 'No content access',
              body: 'This institution holds no approved content. Content reaches a tenant only through an ' +
                'approved institutional access request.' });

    /* ---- what the access actually reaches ---- */
    var groupingNames = rep.groupingIds.map(function (id) {
      var g = data.grouping(id);
      return g ? g.name : id;
    });
    var courseNames = rep.courseIds.map(function (id) {
      var c = data.course(id);
      return c ? c.name : id;
    });

    var reach = ui.card('What this institution holds',
      P.statGrid([
        { label: 'People', value: rep.people, note: rep.students + ' ' + util.plural(rep.students, 'student') +
          ' · ' + rep.faculty + ' ' + util.plural(rep.faculty, 'faculty member', 'faculty members') },
        { label: 'Students with entitlement', value: rep.entitledStudents,
          note: 'Effective entitlement, not enrolment' },
        { label: 'Approved licences', value: rep.allocation.approved,
          note: rep.allocation.assigned + ' assigned · ' + rep.allocation.remaining + ' remaining' },
        { label: 'Experiments held', value: rep.experimentIds.length,
          note: rep.courseIds.length + ' ' + util.plural(rep.courseIds.length, 'course') }
      ]) +
      '<div class="kv" style="margin-top:14px">' +
      '<div class="k">Programmes / departments</div><div class="v">' +
      (groupingNames.length ? esc(groupingNames.join(', ')) : '<span class="muted">None</span>') + '</div>' +
      '<div class="k">Courses reached</div><div class="v">' +
      (courseNames.length ? esc(courseNames.join(', ')) : '<span class="muted">None</span>') + '</div>' +
      '<div class="k">Student groups</div><div class="v">' + rep.groups + '</div>' +
      /* STK31-42 — "students / users by stream where available". The
         stream is the student's own Programme / Department placement,
         and a student without one is shown as such rather than dropped. */
      '<div class="k">Students by stream</div><div class="v">' +
      (rep.byStream.length
        ? rep.byStream.map(function (s) {
            return esc(s.name || 'No stream recorded') + ' — <strong>' + s.students + '</strong>' +
              (s.active !== s.students ? ' <span class="muted">(' + s.active + ' active)</span>' : '');
          }).join('<br>')
        : '<span class="muted">No students</span>') + '</div>' +
      '</div>' +
      '<p class="cardfoot">Licence figures come from the approved request and nothing else. ' +
      'No universal cap, no seat figure without an approved origin, and no revenue metric.</p>', null, 'h2');

    /* ---- STK31-42 — "usage / completion indicators" ----
       Every figure is derived from real learning records and states its
       own denominator. There is no score, index, rank or prediction
       (PM-11 / STK31-29), and the completion rule is the prototype-derived
       one, named as such wherever it appears. */
    var u = rep.usage;
    var usageCard = ui.card('Usage and completion',
      (u.entitlements
        ? P.statGrid([
            { label: 'Started', value: u.started,
              note: 'of ' + u.entitlements + ' student–experiment ' + util.plural(u.entitlements, 'pairing') },
            { label: 'Students who have started', value: u.studentsStarted,
              note: 'of ' + u.students + ' entitled ' + util.plural(u.students, 'student') },
            { label: 'Completed', value: u.completed,
              note: 'of ' + u.entitlements + ' — prototype completion rule' },
            { label: 'Waiting on Faculty', value: u.awaitingReview,
              note: 'pairings held up by an unevaluated written answer' }
          ]) +
          '<p class="cardfoot">The unit is <strong>one student on one experiment</strong>. A student entitled to ' +
          'three experiments counts three times; a student who holds the same experiment through two access ' +
          'records counts <strong>once</strong>, because it is one piece of work. ' +
          '<strong>Completed</strong> uses the prototype-derived completion rule (every learning resource, every ' +
          'entitled simulation, and the assessment where one is configured); it is not a stakeholder-confirmed ' +
          'academic completion policy. <strong>Waiting on Faculty</strong> counts pairings, not individual written ' +
          'answers — one experiment may hold several. No score, index or ranking is produced anywhere.</p>'
        : ui.emptyState({
            icon: 'bars', heading: 'h3',
            title: 'Nothing to report yet',
            body: 'No student at this institution currently holds an effective entitlement, so there is no usage ' +
              'to indicate. Content reaching the tenant entitles nobody; the Tenant Admin still has to assign it.'
          })), null, 'h2');

    /* ---- STK31-25 — student deactivation AS A PLATFORM OVERRIDE ----
       The Tenant Admin owns this day to day; the Super Admin may also
       perform it. It is the same one writer of a student's status, so
       the licence consequence is identical on both planes and there is
       no second kind of "inactive". Nothing else about the student
       changes: no assignment, no access record, no attempt, no review. */
    var studentPeople = state.studentsForTenant(t.id);
    var overrideCard = ui.card('Student access — platform override',
      (studentPeople.length
        ? '<p class="muted" style="margin:0 0 10px">Deactivating a student here does exactly what the Tenant Admin ' +
          'action does: the student holds no effective entitlement while inactive, and their licence returns to the ' +
          'record. Nothing is deleted, and reactivation re-enters the allocation queue at the back so no ' +
          'currently-entitled student is displaced.</p>' +
          '<div class="tscroll"><table class="dt">' +
          '<caption class="sr-only">Students at ' + esc(t.name) + ', with the platform override</caption>' +
          '<thead><tr><th scope="col">Student</th><th scope="col">Stream / Course</th>' +
          '<th scope="col">Entitlements</th><th scope="col">Status</th>' +
          '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
          studentPeople.map(function (p) {
            var m = state.studentCourseMembership(p.id);
            var ents = p.status === 'active' ? state.effectiveEntitlementCount(p.id) : 0;
            var last = (p.overrides || [])[(p.overrides || []).length - 1];
            return '<tr>' +
              '<td data-label="Student"><span class="tmain">' + esc(p.name) + '</span>' +
              '<span class="tsub">' + esc(p.studentId || p.email) + '</span></td>' +
              '<td data-label="Stream / Course">' +
              esc((m && m.grouping ? m.grouping.name : '—') + ' · ' + (m && m.course ? m.course.name : '—')) + '</td>' +
              '<td data-label="Entitlements" class="num">' + ents + '</td>' +
              '<td data-label="Status">' +
              (p.status === 'active' ? ui.badge('b-success', 'check', 'Active') : ui.badge('b-neutral', 'minus', 'Inactive')) +
              (last ? '<span class="tsub">Last platform override ' + esc(util.fmtDate(last.at)) + '</span>' : '') +
              '</td>' +
              '<td class="cell-actions">' +
              (inactive
                ? '<span class="muted">Institution deactivated</span>'
                : '<button class="btn sm sec" type="button" data-ovr="' + esc(p.id) + '" data-to="' +
                  (p.status === 'active' ? 'inactive' : 'active') + '">' +
                  (p.status === 'active' ? 'Deactivate' : 'Reactivate') + '</button>') +
              '</td></tr>';
          }).join('') + '</tbody></table></div>' +
          '<p class="cardfoot">Every override is recorded on the student&rsquo;s own record and on this ' +
          'institution&rsquo;s governance history, with the reason given. Nothing is sent to anybody — there is no ' +
          'notification provider in this build.</p>'
        : ui.emptyState({
            icon: 'users', heading: 'h3',
            title: 'No students recorded',
            body: 'This institution has no student records yet. The Tenant Admin creates them manually or by CSV ' +
              'import; the platform does not create people.'
          })), null, 'h2');

    /* ---- operational signals ---- */
    var signals = [];
    rep.expiryReminders.forEach(function (rec) {
      signals.push({ tone: 'warn', icon: 'clock',
        title: rec.id + ' — expiry reminder due',
        body: esc(P.expiryLine(rec)) + '. The tenant must be reminded 15 days ahead. ' +
          'The delivery channel is not selected, so nothing has been sent.',
        href: P.href.operations(), label: 'Operations',
        aria: 'Open operations for the expiring access record ' + rec.id });
    });
    rep.expiredAccess.forEach(function (rec) {
      signals.push({ tone: 'warn', icon: 'alertCirc',
        title: rec.id + ' — access term ended',
        body: 'Ended ' + esc(util.fmtDate(rec.endsOn)) + '. Entitlement derived from it has stopped being ' +
          'effective; nothing has been deleted. There is no automatic renewal.',
        href: P.href.operations(), label: 'Operations',
        aria: 'Open operations for the expired access record ' + rec.id });
    });
    rep.openTickets.forEach(function (tk) {
      signals.push({ tone: 'warn', icon: 'alertCirc',
        title: tk.subject,
        body: esc(state.supportCategoryLabel(tk.category)) + ' · reported by ' + esc(tk.requesterName),
        href: P.href.ticket(tk.id), label: 'Open',
        aria: 'Open support report ' + tk.id });
    });
    /* WHOSE MOVE IS IT? A device request is `submitted` while it sits
       with this institution's own Institute / Tenant Admin and only
       becomes `escalated` when that person forwards it. Filtering this
       attention list on `submitted` told the Super Admin that requests
       nobody had forwarded were HIS to decide — which is the direct
       student-to-platform routing the correction removes, reappearing
       through a report. The two are separated: one row asks the Super
       Admin to act, the other tells him what the institution owes and
       says plainly that it is not his to decide. */
    rep.transfers.filter(function (x) { return x.status === state.TRANSFER_STATUS.ESCALATED; })
      .forEach(function (tr) {
        signals.push({ tone: 'warn', icon: 'monitor',
          title: tr.personName + ' — device replacement request forwarded',
          body: 'Forwarded by ' + esc(tr.escalatedBy || 'the Institute / Tenant Admin') +
            (tr.escalatedAt ? ' on ' + esc(util.fmtDate(tr.escalatedAt)) : '') +
            ' and awaiting your decision. Approving it grants no content and consumes no licence.',
          href: P.href.transfer(tr.id), label: 'Review',
          aria: 'Review device transfer ' + tr.id });
      });
    rep.transfers.filter(function (x) { return x.status === state.TRANSFER_STATUS.SUBMITTED; })
      .forEach(function (tr) {
        signals.push({ tone: 'info', icon: 'clock',
          title: tr.personName + ' — device replacement request with this institution',
          body: 'Raised ' + esc(util.fmtDate(tr.createdAt)) + ' and still with ' + esc(t.name) +
            '&rsquo;s own Institute / Tenant Admin, who reviews it and forwards it. ' +
            '<strong>This one is not the platform&rsquo;s to decide</strong> — the move belongs to them.' +
            (rep.admins.length ? '' : ' No Tenant Admin is assigned here, so nobody can forward it.'),
          href: P.href.transfer(tr.id), label: 'Open',
          aria: 'Open device transfer ' + tr.id });
      });

    var signalCard = ui.card('Issues requiring attention',
      P.attentionList(signals, {
        icon: 'check', heading: 'h3',
        title: 'Nothing needs attention',
        body: 'No expiring term, no expired access, no open support report and no device request for this institution.'
      }), null, 'h2');

    /* ---- governance ---- */
    var governance = ui.card(inactive ? 'Reactivate this institution' : 'Deactivate this institution',
      (inactive
        ? '<p>Reactivating restores access <strong>only where the underlying entitlement, allocation and term are ' +
          'still valid</strong>. Nothing was deleted while the institution was deactivated, and nothing is ' +
          'recreated now: the same assignments and the same allocation ordering come back, so no student is ' +
          'displaced.</p>'
        : '<p>Deactivation is <strong>reversible</strong> and destroys nothing. People, groups, academic ' +
          'mappings, assignments, licence allocation, assessment attempts, reviews and progress are all kept ' +
          'exactly as they are.</p>' +
          '<p style="margin-top:6px">While the institution is deactivated: the Tenant Admin cannot take ' +
          'operational actions, Faculty cannot use mapped content, and Students cannot launch learning. ' +
          'Nothing about their history changes.</p>') +
      '<div class="formact">' +
      (inactive
        ? '<button class="btn pri" type="button" id="ten-reactivate">' + ui.ic('check') + 'Reactivate institution</button>'
        : '<button class="btn dgr" type="button" id="ten-deactivate">' + ui.ic('alertCirc') + 'Deactivate institution</button>') +
      '<span class="formnote">There is no delete. A tenant is never physically removed.</span>' +
      '</div>', null, 'h2');

    /* ---- governance history ---- */
    var hist = (t.history || []).slice().reverse();
    var historyCard = ui.card('Governance history',
      hist.length
        ? '<div class="timeline">' + hist.map(function (h) {
            var cls = h.kind === 'deactivated' ? 'warn' : h.kind === 'reactivated' ? 'good' : 'info';
            return '<div class="tl-item"><span class="tl-dot ' + cls + '">' +
              ui.ic(h.kind === 'deactivated' ? 'alertCirc' : h.kind === 'reactivated' ? 'check' : 'users') + '</span>' +
              '<div class="tl-body"><div class="tl-action">' + esc(h.label) + '</div>' +
              '<div class="tl-who">' + esc(h.who) + ' · ' + esc(util.fmtDateTime(h.at)) + '</div>' +
              (h.note ? '<p class="tl-note">' + esc(h.note) + '</p>' : '') +
              '</div></div>';
          }).join('') + '</div>'
        : '<p class="muted">No governance action has been taken on this institution.</p>', null, 'h2');

    var html =
      ui.crumbs([{ label: 'Institutions', href: P.href.institutions() }, { label: t.name }]) +
      ui.phead(t.name, esc(t.accessContext) + ' · ' + esc(t.kind === 'internal' ? 'Internal' : 'External'),
        /* ⚠ PROTOTYPE VIEW SWITCH, not a Super Admin capability. This
           crosses an authority altitude: the Super Admin decides what a
           tenant may use, the Tenant Admin decides which student gets
           what (STK31-24 / STK31-25). In the product these are different
           people signing in separately; there is no authentication here,
           so the link is labelled for what it is rather than presented
           as platform chrome. */
        '<a class="btn sec" href="#/tenant/' + encodeURIComponent(t.id) + '/overview" ' +
        'title="Prototype view switch — the Tenant Admin workspace is a different role">' +
        'Prototype: open the Tenant Admin workspace</a>',
        ' ' + P.tenantBadge(t)) +
      (inactive
        ? ui.alertBox('warning', 'This institution is deactivated',
            '<p>' + esc(state.TENANT_INACTIVE_TEXT) + '</p>')
        : '') +
      /* TENANT EXISTENCE IS NOT TENANT CONTENT ACCESS. Approving an
         external request creates the institution so its Tenant Admin can
         be assigned (STK31-21); the access record waits for payment. The
         report says which of the two states this is, so the two are
         never read as one. */
      (awaitingReq
        ? ui.alertBox('info', 'This institution exists, but holds no content yet',
            '<p>It was created by approving request <strong>' + esc(awaitingReq.id) + '</strong>, which is ' +
            '<strong>awaiting payment</strong>. You can assign its Tenant Admin now; the approved content, ' +
            'technologies, licences and term are written when payment completes.</p>' +
            '<p style="margin-top:8px">Until then <strong>nothing is assignable inside it</strong>, no student ' +
            'holds an entitlement, and no Faculty member reaches any content.</p>')
        : '') +
      '<div class="grid-rail">' +
      '<div class="stack">' + identity + reach + usageCard +
      ui.card('Content access, licences and term', accessRows, null, 'h2') +
      overrideCard + signalCard + governance + '</div>' +
      '<div class="stack">' + adminCard + historyCard +
      (rep.expiryReminders.length ? P.reminderNote() : '') +
      ui.gapNote('NOT IN THIS BUILD',
        'Institution-level reporting beyond the operational and usage facts above — per-student result ' +
        'breakdowns, exportable reports and time-series trends — is not built. ' +
        'No revenue or financial metric appears here by instruction.') +
      '</div></div>';

    return {
      title: t.name, html: html, navKey: 'institutions',
      after: function () {
        var deact = document.getElementById('ten-deactivate');
        if (deact) {
          deact.addEventListener('click', function () {
            ui.openDialog({
              title: 'Deactivate ' + t.name + '?',
              bodyHTML:
                '<p>The institution stops being able to operate. <strong>Nothing is deleted.</strong></p>' +
                '<div class="consequence">' + ui.ic('info') + '<span>' +
                rep.entitledStudents + ' ' + util.plural(rep.entitledStudents, 'student') +
                ' currently holding an entitlement will not be able to launch learning, and Faculty will not be ' +
                'able to use mapped content. All progress, attempts and reviews are kept, and reactivation ' +
                'restores exactly what is still valid.</span></div>' +
                '<div class="field" id="ten-reason" style="margin-top:12px">' +
                '<label for="ten-reason-i">Reason (recorded in the governance history)</label>' +
                '<input type="text" id="ten-reason-i" autocomplete="off"></div>',
              okLabel: 'Deactivate institution',
              onConfirm: function (body) {
                var input = body ? body.querySelector('#ten-reason-i') : null;
                state.deactivateTenant(t.id, input ? input.value : '');
                ui.toast(t.name + ' deactivated. Nothing was deleted.');
                XRSLP.render(false);
              }
            });
          });
        }
        var react = document.getElementById('ten-reactivate');
        if (react) {
          react.addEventListener('click', function () {
            ui.openDialog({
              title: 'Reactivate ' + t.name + '?',
              bodyHTML:
                '<p>Access returns <strong>only where the underlying entitlement, allocation and term are still ' +
                'valid</strong>. An access record whose term ended while the institution was deactivated stays ' +
                'expired.</p>' +
                '<div class="consequence">' + ui.ic('check') + '<span>The existing allocation ordering is ' +
                'untouched, so no student is displaced by reactivation.</span></div>' +
                '<div class="field" id="ten-rreason" style="margin-top:12px">' +
                '<label for="ten-rreason-i">Note (recorded in the governance history)</label>' +
                '<input type="text" id="ten-rreason-i" autocomplete="off"></div>',
              okLabel: 'Reactivate institution',
              onConfirm: function (body) {
                var input = body ? body.querySelector('#ten-rreason-i') : null;
                state.reactivateTenant(t.id, input ? input.value : '');
                ui.toast(t.name + ' reactivated.');
                XRSLP.render(false);
              }
            });
          });
        }

        /* STK31-25 — the platform override, with its consequence stated
           before it is taken and a reason required to take it. */
        Array.prototype.slice.call(document.querySelectorAll('[data-ovr]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var pid = btn.getAttribute('data-ovr');
            var to = btn.getAttribute('data-to');
            var p = state.personById(pid);
            if (!p) { return; }
            var held = state.effectiveEntitlementCount(pid);
            ui.openDialog({
              title: (to === 'inactive' ? 'Deactivate ' : 'Reactivate ') + p.name + '?',
              bodyHTML:
                '<p>This is a <strong>platform override</strong> of a Tenant Admin action, taken on a student of ' +
                '<strong>' + esc(t.name) + '</strong>.</p>' +
                (to === 'inactive'
                  ? '<div class="consequence">' + ui.ic('info') + '<span>' + esc(p.name) + ' currently holds <strong>' +
                    held + '</strong> effective ' + util.plural(held, 'entitlement') + '. While inactive they hold ' +
                    'none and cannot launch anything, and their licence returns to the access record for another ' +
                    'student. <strong>Nothing is deleted</strong> — assignments, groups, progress, attempts and ' +
                    'reviews are all kept.</span></div>'
                  : '<div class="consequence">' + ui.ic('check') + '<span>' + esc(p.name) + ' re-enters the allocation ' +
                    'queue <strong>at the back</strong>, so no student who is currently entitled is displaced. If ' +
                    'the record is full they are shown as held, never silently entitled.</span></div>') +
                '<div class="field" id="ovr-reason" style="margin-top:12px">' +
                '<label for="ovr-reason-i">Reason <span class="req">(required)</span></label>' +
                '<input type="text" id="ovr-reason-i" autocomplete="off"></div>' +
                '<p class="muted" style="margin-top:8px">Recorded on the student&rsquo;s record and on this ' +
                'institution&rsquo;s governance history. Nothing is sent to anybody.</p>',
              okLabel: to === 'inactive' ? 'Deactivate student' : 'Reactivate student',
              onConfirm: function (body) {
                var input = body ? body.querySelector('#ovr-reason-i') : null;
                var out = state.setStudentStatusAsPlatform(pid, to, input ? input.value : '');
                ui.toast(out
                  ? p.name + (to === 'inactive' ? ' deactivated by platform override.' : ' reactivated by platform override.')
                  : 'No change — a reason is required for a platform override.');
                XRSLP.render(false);
              }
            });
          });
        });

        var form = document.getElementById('ta-form');
        if (form) {
          var busy = false;
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (busy) { return; }
            var fields = {
              name: (document.getElementById('ta-name-i') || {}).value || '',
              email: (document.getElementById('ta-email-i') || {}).value || ''
            };
            var errs = state.validateTenantAdmin(t.id, fields);
            if (!ui.showErrors(form, errs, 'Please correct the assignment')) { return; }
            busy = true;
            var res = state.assignTenantAdmin(t.id, fields);
            if (!res.ok) { busy = false; ui.showErrors(form, res.errors, 'Please correct the assignment'); return; }
            ui.toast(res.admin.name + ' assigned as Tenant Admin for ' + t.name + '.');
            XRSLP.render(false);
          });
        }
        Array.prototype.slice.call(document.querySelectorAll('[data-rm-admin]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-rm-admin');
            var admin = state.tenantAdminById(id);
            if (!admin) { return; }
            ui.openDialog({
              title: 'Remove ' + admin.name + ' as Tenant Admin?',
              bodyHTML: '<p>The assignment is recorded as removed, not deleted, and appears in the ' +
                'institution&rsquo;s governance history.</p>' +
                '<div class="consequence">' + ui.ic('info') + '<span>Removing the only Tenant Admin leaves this ' +
                'institution with nobody recorded as responsible for its people and assignments.</span></div>',
              okLabel: 'Remove assignment',
              onConfirm: function () {
                state.removeTenantAdmin(id);
                ui.toast('Tenant Admin assignment removed.');
                XRSLP.render(false);
              }
            });
          });
        });
      }
    };
  };
})();
