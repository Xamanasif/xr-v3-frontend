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
  /* ⚠ THE EMPTY STATE IS COMPACT, and that is the whole point of it.

     "Nothing needs a decision" is the GOOD outcome and the common one —
     a governance queue is empty most of the time. Rendered through
     `ui.emptyState` it was a 48px medallion and 48px of padding, so
     Content governance opened as two enormous white cards saying
     nothing is wrong, with the content the reader came for pushed below
     the fold. `ui.emptyRow` says the same thing in one line, with the
     tick that marks it as a result rather than an absence.

     `emptyOpts.large` forces the full treatment for the one case where
     the empty state IS the page's purpose. */
  function attentionList(items, emptyOpts) {
    if (!items.length) {
      var o = emptyOpts || {
        icon: 'check', heading: 'h3',
        title: 'Nothing needs a decision',
        body: 'No request, version, transfer, support report or expiring term is waiting on the platform, and ' +
          'no Experiment is stalled with nobody able to act on it.'
      };
      if (o.large) { return ui.emptyState(o); }
      return ui.emptyRow({
        icon: o.icon || 'check', ok: true, heading: o.heading || 'h3',
        title: o.title, body: o.body
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

  /* The honest statement about the 15-day reminder, in one sentence.
     ⚠ THE "NOTHING HAS BEEN SENT" CLAIM IS LOAD-BEARING AND MUST
     SURVIVE ANY REWRITE of this function: an operator who believes the
     institution was emailed will not follow it up, and no email, SMS,
     push or notification provider exists anywhere in this build.

     What was cut is the scaffolding around it. The old version was a
     five-sentence `gapNote` — tagged DELIVERY CHANNEL PENDING, framed as
     a missing requirement — repeated verbatim on the Overview, the
     institution report and Operations. The requirement itself (a tenant
     is reminded 15 days ahead) is confirmed and is stated by the queue
     it sits on; only the delivery is unbuilt, and saying so once, as a
     product fact, is the whole of it. It is now rendered ONLY beside the
     expiry queue on Operations — the surface that owns the reminder
     state — rather than on three screens at once. */
  function reminderNote() {
    return ui.alertBox('info', 'The reminder is a due state, not a message',
      '<p>Nothing has been sent to anybody — this build integrates no email, SMS, push or notification ' +
      'provider. The institution sees the same due state on its own workspace, and no term renews, ' +
      'extends or charges automatically.</p>');
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

    /* ⚠ FOUR TILES, NOT EIGHT.

       This grid carried one tile per queue — requests, institutions,
       versions, transfers, support, expiry, stalled experiments, role
       holders with no scope — eight figures, and on a healthy platform
       seven of them read 0. Eight zeroes of equal weight is not a
       dashboard; it is a readout of every collection in the system, and
       "Needs a decision" directly beneath it says the same thing again,
       grouped, with the actions attached.

       So the strip answers the question the queue below cannot: how much
       is waiting IN TOTAL, and what is the platform's standing shape —
       institutions and published content. Everything else is a row in
       the decision list, where it has a destination and a verb. */
    var awaitingTotal = o.requestsAwaiting.length + o.versionsAwaiting.length +
      o.transfersAwaiting.length + o.ticketsOpen.length;
    var publishedCount = state.contentRecords().filter(function (r) {
      return r.status === state.CONTENT_STATUS.PUBLISHED;
    }).length;

    var tiles = P.statGrid([
      { label: 'Pending decisions', value: awaitingTotal,
        tone: awaitingTotal ? 'warn' : '', href: P.href.requests(),
        note: awaitingTotal ? 'across every queue' : 'nothing waiting' },
      { label: 'Institutions', value: o.activeTenants.length, href: P.href.institutions(),
        note: o.inactiveTenants.length
          ? o.inactiveTenants.length + ' deactivated' : 'all active' },
      { label: 'Published experiments', value: publishedCount, href: P.href.content(),
        note: o.versionsAwaiting.length
          ? o.versionsAwaiting.length + ' new ' + util.plural(o.versionsAwaiting.length, 'version') + ' awaiting release'
          : 'experiments in the catalogue' },
      { label: 'Access expiring soon', value: o.expiryReminders.length,
        tone: o.expiryReminders.length ? 'warn' : '', href: P.href.operations(),
        note: o.expiredAccess.length
          ? o.expiredAccess.length + ' already expired' : 'within 15 days' }
    ]);

    /* ---- the attention list: one grammar, many sources ----
       GROUPED, COUNTED AND CAPPED. Eight signal types concatenated into
       one flat list is fine on the sample data and becomes the whole
       page on any real one: nothing sorted it, nothing grouped it and
       nothing stopped it. Each kind now carries its own heading, its own
       total and a cap, with the rest one click away on the surface that
       can actually work through them. The ORDER of the kinds is
       unchanged — a stalled Experiment is still not more urgent than an
       institution waiting on a decision. */
    var groups = [];
    function group(title, href, list) {
      if (list.length) { groups.push({ title: title, href: href, items: list }); }
    }

    var requestItems = o.requestsAwaiting.map(function (r) {
      return {
        tone: 'warn', icon: 'doc',
        title: r.institution.name + ' — access request ' + r.id,
        body: r.items.length + ' ' + util.plural(r.items.length, 'experiment') + ' · ' + r.quantity + ' ' +
          util.plural(r.quantity, 'user') + ' · ' + esc((data.term(r.term) || {}).label || r.term) +
          ' · submitted ' + esc(util.fmtDate(r.submittedAt)),
        href: P.href.request(r.id), label: 'Review',
        aria: 'Review access request ' + r.id + ' from ' + r.institution.name
      };
    });
    var versionItems = o.versionsAwaiting.map(function (v) {
      var rec = state.contentRecord(v.recordId);
      return {
        tone: 'warn', icon: 'layers',
        title: (rec ? rec.name : v.recordId) + ' — version ' + v.versionLabel + ' awaiting Release / Hold',
        body: 'Academically approved' + (v.academicDecisionByName ? ' by ' + esc(v.academicDecisionByName) : '') +
          '. The published version ' + esc(v.replacesVersionLabel || '—') + ' stays live until you release this one.',
        href: P.href.record(v.recordId), label: 'Decide',
        aria: 'Decide Release or Hold for version ' + v.versionLabel + ' of ' + (rec ? rec.name : v.recordId)
      };
    });
    var transferItems = o.transfersAwaiting.map(function (r) {
      var t = state.tenantById(r.tenantId);
      return {
        tone: 'warn', icon: 'monitor',
        title: r.personName + ' — device replacement request',
        body: (t ? esc(t.name) + ' · ' : '') + 'requested ' + esc(util.fmtDate(r.createdAt)) +
          '. Approving moves the authorised device binding; it grants no content and consumes no licence.',
        href: P.href.transfer(r.id), label: 'Review',
        aria: 'Review device transfer request ' + r.id + ' from ' + r.personName
      };
    });
    var ticketItems = o.ticketsOpen.map(function (t) {
      var ten = t.tenantId ? state.tenantById(t.tenantId) : null;
      return {
        tone: 'warn', icon: 'alertCirc',
        title: t.subject,
        body: esc(state.supportCategoryLabel(t.category)) + ' · reported by ' + esc(t.requesterName) +
          (ten ? ' · ' + esc(ten.name) : '') + ' · ' + esc(util.fmtDate(t.createdAt)),
        href: P.href.ticket(t.id), label: 'Open',
        aria: 'Open support report ' + t.id + ': ' + t.subject
      };
    });
    var expiryItems = o.expiryReminders.map(function (rec) {
      var t = state.tenantById(rec.tenantId);
      return {
        tone: 'warn', icon: 'clock',
        title: (t ? t.name : rec.tenantId) + ' — access term expiring',
        /* The "nothing has been sent" claim is load-bearing and stays,
           but it is attached to the reminder state ONCE, on the
           Operations card that owns it — not restated on every row of
           every list that mentions an expiry. */
        /* §1 — an Overview carries no forensic reference. The institution
           is in the title; the content and the date distinguish the row. */
        body: ui.accessTitle(rec) + ' \u00b7 ' + esc(P.expiryLine(rec)),
        href: P.href.institution(rec.tenantId), label: 'Institution',
        aria: 'Open the institution report for ' + (t ? t.name : rec.tenantId)
      };
    });
    var adminItems = o.tenantsWithoutAdmin.map(function (t) {
      return {
        tone: 'warn', icon: 'users',
        title: t.name + ' — no Tenant Admin assigned',
        body: 'Nobody at this institution is recorded as responsible for its people and assignments.',
        href: P.href.institution(t.id), label: 'Assign',
        aria: 'Assign a Tenant Admin for ' + t.name
      };
    });

    group('Access requests awaiting a decision', P.href.requests(), requestItems);
    group('Versions awaiting Release / Hold', P.href.content(), versionItems);
    group('Device transfers forwarded to the platform', P.href.operations(), transferItems);
    group('Support reports open', P.href.operations(), ticketItems);
    group('Access terms expiring within 15 days', P.href.operations(), expiryItems);
    group('Institutions with no Tenant Admin', P.href.institutions(), adminItems);
    /* R17 — the content chain's problems reach the same list as
       everything else. They sit LAST on purpose: a stuck Experiment is
       not more urgent than an institution waiting on a decision, and
       the point of the correction is that the Super Admin is TOLD, not
       that the ordering is rewritten around content. */
    group('Experiments nobody can act on', P.href.content(), blocked);
    group('Role holders with no scope', P.href.roles(), scopeless);

    var total = groups.reduce(function (n, g) { return n + g.items.length; }, 0);

    /* Four rows per kind. The cap exists so that one busy queue cannot
       bury the other seven — the total is always stated, and the surface
       that can work through the rest is one click away. */
    var GROUP_CAP = 4;
    var attentionHTML = total
      ? groups.map(function (g) {
          var shown = g.items.slice(0, GROUP_CAP);
          return '<h3 class="vh">' + esc(g.title) + ' — ' + g.items.length + '</h3>' +
            P.attentionList(shown) +
            (g.items.length > GROUP_CAP
              ? '<p class="cardfoot"><a href="' + g.href + '">' + (g.items.length - GROUP_CAP) +
                /* NOT `toLowerCase()`. These titles carry fixed product
                   terms — "Access requests", "Device transfers",
                   "Support reports" — and lowercasing them renames the
                   destination the link opens. */
                ' more of these — open ' + esc(g.title) + '</a></p>'
              : '');
        }).join('')
      /* §6/§11 — the zero state was a panel listing every kind of item
         that is NOT waiting. One line says it. Only the Overview's own
         empty case changes; `attentionList`'s default is untouched for
         the screens that still use it. */
      : ui.okRow('No decisions waiting');

    /* §6 — the page was clean but abstract: four numbers, a sentence
       about how the numbers are counted, and no statement of what this
       workspace is for or what to do next. The counting sentence is
       documentation, not product copy (§13), and is gone. */
    /* §9 — the Super Admin holds six distinct responsibilities and the
       page named four of them as bare links. Each workspace now says
       what it is for, in the words of what is actually implemented. */
    var workspaces = ui.navTiles([
      { href: P.href.requests(), icon: 'doc', label: 'Access requests',
        desc: 'Review institutional content requests.' },
      { href: P.href.institutions(), icon: 'building', label: 'Institutions',
        desc: 'Manage institutions, admins and institution status.' },
      { href: P.href.content(), icon: 'layers', label: 'Content governance',
        desc: 'Review later versions and Release / Hold decisions.' },
      { href: P.href.structure(), icon: 'book', label: 'Academic structure',
        desc: 'Manage Programmes / Departments and Courses.' },
      { href: P.href.roles(), icon: 'shield', label: 'Role governance',
        desc: 'Manage content-production role scopes.' },
      { href: P.href.operations(), icon: 'monitor', label: 'Operations',
        desc: 'Handle support, device requests and expiring access.' }
    ], { cols: 3 });

    var html =
      /* §7 — the header restated the waiting count that the summary
         cards and the queue below both already carry. The orientation
         sentence is the only subtitle now. */
      ui.phead('Overview') +
      ui.orient('Manage institutions, access decisions, content governance and platform operations.') +
      '<div class="stack">' +
      ui.card('Platform at a glance', tiles, null, 'h2') +
      /* §10 — a zero state does not get a card. When something IS
         waiting, the queue takes the card back. */
      (total
        ? ui.card('Needs a decision', attentionHTML,
            total + ' ' + util.plural(total, 'item') + ' across ' +
            groups.length + ' ' + util.plural(groups.length, 'kind') + ' of work', 'h2')
        : '<div class="ov-ok">' + ui.okRow('No decisions are waiting') + '</div>') +
      ui.card('Platform workspaces', workspaces, null, 'h2') +
      /* The reminder note used to be repeated here as well. It belongs
         beside the expiry queue on Operations, which is where the rows
         above already lead. */
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
              '<span class="tsub">extends ' +
                (state.accessById(r.renewsAccessId)
                  ? ui.accessTitle(state.accessById(r.renewsAccessId))
                  : 'access no longer on the platform') + '</span>'
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

    /* ── ONE READ MODEL FOR THE OVERLAP, READ BY THREE SURFACES ──
       The summary strip, the requested-content table and the existing-
       access comparison all answer one question — what does this
       institution already hold of what it is asking for? Deriving it
       three times is how three answers drift apart, so it is derived
       once, here. */
    var heldByExperiment = {};
    held.forEach(function (h) { heldByExperiment[h.experimentId] = h.rows; });

    /* RECORD-FIRST FOR THE COMPARISON, EXPERIMENT-FIRST FOR THE TABLE.
       `heldSelectionFor` groups by EXPERIMENT, which answers "is this one
       held?" and is exactly what the requested-content table needs. It is
       the wrong shape for showing the institution's position: licence
       quantity, term and assignability all belong to the RECORD, so a
       record carrying three of the requested experiments has to be read
       ONCE, as one record, with the three named on it.

       Regrouping here is also what makes the repetition legible. One
       Experiment sitting on two access records appears under both,
       because it genuinely sits on both — two independent terms, two
       independent licence pools — and a reader seeing the record ids
       reads that as two records rather than as a duplicated row. */
    var heldRecords = [];
    (function () {
      var seen = {};
      held.forEach(function (h) {
        h.rows.forEach(function (row) {
          var entry = seen[row.record.id];
          if (!entry) {
            entry = { row: row, experimentIds: [], technologies: [] };
            seen[row.record.id] = entry;
            heldRecords.push(entry);
          }
          entry.experimentIds.push(h.experimentId);
          row.technologies.forEach(function (t) {
            if (entry.technologies.indexOf(t) === -1) { entry.technologies.push(t); }
          });
        });
      });
    })();

    /* THE TECHNOLOGY TOTAL IS A REQUEST FACT, not a confirmation-dialog
       fact. It used to be computed only inside the approve handler, so
       the operator could read "12 of 14 technology variants" in the
       dialog having had no way to know 14 was the number. */
    function techTotal(list) {
      return list.reduce(function (n, i) { return n + i.technologies.length; }, 0);
    }
    var askedTech = techTotal(r.items);
    var sinceSubmitted = util.daysUntil(r.submittedAt);
    var queueDays = sinceSubmitted == null ? null : Math.max(0, -sinceSubmitted);

    /* ---- the requested content, as a table ----
       One row per Experiment, with the overlap answered in its own
       column: the reviewer reads "expansion" or "first purchase" per
       line rather than assembling it from a paragraph. */
    var itemRows = r.items.map(function (item) {
      var ctx = data.contextOf(item.experimentId);
      var rows = heldByExperiment[item.experimentId] || [];
      var liveRows = rows.filter(function (x) { return x.live; });
      var overlapCell;
      if (!reqTenant) {
        overlapCell = '<span class="muted">New institution</span>';
      } else if (!rows.length) {
        overlapCell = '<span class="muted">Not held</span>';
      } else {
        overlapCell = ui.badge(liveRows.length ? 'b-info' : 'b-neutral', 'layers',
            liveRows.length ? 'Already held' : 'Held under an ended term') +
          /* Listed the record keys. What a reviewer needs is under which
             terms it is already held — the keys say nothing they can weigh. */
          '<span class="tsub">' + rows.map(function (x) {
            return esc(P.expiryLine(x.record));
          }).join('; ') + '</span>';
      }
      return '<tr>' +
        '<td data-label="Experiment"><span class="tmain">' +
        esc(ctx ? ctx.experiment.name : item.experimentId) + '</span>' +
        '<span class="tsub">' +
        (ctx ? esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name) : esc(item.experimentId)) +
        '</span></td>' +
        '<td data-label="Technologies requested">' + ui.techBadges(item.technologies) + '</td>' +
        '<td data-label="Already held">' + overlapCell + '</td>' +
        '</tr>';
    }).join('');

    var itemsCard = ui.card('Requested content',
      (r.items.length
        ? '<div class="tscroll"><table class="dt">' +
          '<caption class="sr-only">Experiments and technology variants requested on ' + esc(r.id) + '</caption>' +
          '<thead><tr><th scope="col">Experiment</th><th scope="col">Technologies requested</th>' +
          '<th scope="col">Already held</th></tr></thead><tbody>' + itemRows + '</tbody></table></div>'
        : ui.emptyRow({ icon: 'alertCirc', heading: 'h3',
            title: 'No experiment on this request',
            body: 'The request carries no content, so there is nothing an approval could grant.' })),
      null, 'h2');

    /* ---- the workflow strip ----
       The same request states the queue filters on, in the order they
       actually happen, so an approved-awaiting-payment request reads as
       mid-journey rather than as an unexplained status word. */
    var trackSteps = [{ t: 'Submitted', d: util.fmtDate(r.submittedAt), state: 'done' }];
    if (r.status === state.STATUS.INFO_REQUESTED) {
      trackSteps.push({ t: 'More information requested', d: 'Back with the institution', state: 'live' });
      trackSteps.push({ t: 'Platform decision', d: 'Resumes when they resubmit', state: 'todo' });
    } else {
      trackSteps.push({
        t: 'Platform decision',
        d: r.status === state.STATUS.SUBMITTED ? 'Yours to take now' : 'Taken',
        state: r.status === state.STATUS.SUBMITTED
          ? (state.requestDecisionBlock(r) ? 'blocked' : 'live')
          : 'done'
      });
    }
    if (r.paymentRequired) {
      trackSteps.push({
        t: 'Payment by the institution',
        d: 'Same step it was onboarded through',
        state: r.status === state.STATUS.ACTIVE ? 'done'
          : r.status === state.STATUS.APPROVED_PAYMENT_REQUIRED ? 'live' : 'todo'
      });
    }
    trackSteps.push({
      t: r.renewsAccessId ? 'Term extended' : 'Access active',
      d: r.renewsAccessId ? 'On the existing access' : 'New access is written',
      state: r.status === state.STATUS.ACTIVE ? 'done' : 'todo'
    });

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

    /* WHICH INSTITUTION THIS WILL ACTIVATE ONTO, in one sentence.
       The institution name on a request is free text, so a request
       either joins an institution the platform already knows or creates
       a new one, and that identity decision used to be invisible until
       after it had been taken. The lookup is unchanged: matching by name
       is what lets a returning institution add a second access record
       rather than becoming a duplicate tenant.

       ⚠ SAID ONCE. This sentence is the single source for the identity
       fact on this screen — the consequence list below and the approve
       dialog both read this variable — because the previous version
       stated it in five places and they were free to disagree. */
    var identityLine = r.renewsAccessId
      ? 'Extends the term of <strong>' +
        (renewsRec ? ui.accessTitle(renewsRec) : 'access already held') + '</strong>' +
        (reqTenant ? ', held by ' + esc(reqTenant.name) : '') +
        '. No second institution, no second set of access and no additional licence.'
      : reqTenant
      ? 'Adds approved content to the existing institution <strong>' + esc(reqTenant.name) +
        '</strong>. No second institution is created.'
      : 'Creates the institution <strong>' + esc(r.institution.name) +
        '</strong> — no institution on the platform matches this name.';

    /* THE ROUTE, said once, in the same grammar. */
    var routeLine = r.paymentRequired
      ? 'Moves to <strong>Approved — payment required</strong>. ' +
        (r.renewsAccessId ? 'The term moves' : 'Access activates') +
        ' only when the institution completes the payment step it was onboarded through.'
      : '<strong>' + (r.renewsAccessId ? 'The term moves' : 'Access activates') +
        ' immediately</strong> — the ' + esc(r.institution.accessContext) + ' route carries no payment step.';

    /* WHO IS ENTITLED AFTERWARDS — the fact operators most often assume
       wrongly, and the one that genuinely differs between a purchase and
       a renewal. */
    var entitlementLine = r.renewsAccessId
      ? 'Entitles <strong>no new student</strong>. Students already assigned under that record continue, or ' +
        'resume if the term had ended.'
      : 'Entitles <strong>no student</strong>. The Tenant Admin still has to assign the content.';

    /* The consequence list: four short lines, each fact stated exactly
       once, immediately above the buttons that cause them. */
    function consequenceList() {
      var lines = [
        { icon: 'building', html: identityLine },
        { icon: r.paymentRequired ? 'card' : 'check', html: routeLine },
        { icon: 'alertCirc', html: entitlementLine }
      ];
      if (held.length) {
        lines.push({ icon: 'layers',
          html: '<strong>' + held.length + ' of ' + r.items.length + ' requested ' +
            util.plural(r.items.length, 'experiment') + '</strong> ' +
            (held.length === 1 ? 'is' : 'are') + ' already on a record this institution holds — an ' +
            '<strong>expansion</strong>, not a first purchase. Nothing here argues against approving it.' });
      }
      return '<ul class="reslist plain">' + lines.map(function (l) {
        return '<li>' + ui.ic(l.icon) + '<span>' + l.html + '</span></li>';
      }).join('') + '</ul>';
    }

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
      /* ONE ROW PER EXPERIMENT IN THE GRANT EDITOR, in exactly the same
         row shape as the requested-content list above it — because it is
         the same content, with the technologies made narrowable.

         ⚠ THIS IS WHY IT IS NOT `.grantrow` / `.granttechs` / `.chk`
         ANY MORE. Those three classes, and `.grantbox` and `.fhint`
         around them, had no rule in any of the six stylesheets, and
         `.chk` was styled only under `.listbar`. The single most
         consequential control in this workspace therefore rendered as
         raw browser defaults: a bare disclosure triangle, unstyled
         checkboxes and no separation between experiments. It is now
         built from `details.canon`, `.reqitems .ri` and `.field` — the
         disclosure, list-row and form primitives the design system
         already carries — so it is styled by construction.

         The ids and hooks are unchanged: `readGrant()` reads
         `.grant-tech[data-exp]`, `#gq` and `#gt`, and
         `state.validateGrant` returns errors against `grant-items`,
         `grant-quantity` and `grant-term`. */
      var allocRows = r.items.map(function (item, ix) {
        var ctx = data.contextOf(item.experimentId);
        return '<div class="ri">' +
          '<div class="ri-body">' +
          '<div class="ri-ctx">' + (ctx ? esc(ctx.grouping.name) + ' › ' + esc(ctx.course.name) : '') + '</div>' +
          '<div class="ri-t">' + esc(ctx ? ctx.experiment.name : item.experimentId) + '</div>' +
          '</div>' +
          '<div class="ri-tech">' + item.technologies.map(function (t, tx) {
            var tid = 'gt-' + ix + '-' + tx;
            return '<label class="radiorow" for="' + tid + '"><input type="checkbox" id="' + tid +
              '" class="grant-tech" data-exp="' + esc(item.experimentId) + '" value="' + esc(t) + '" checked> ' +
              esc((data.TECHNOLOGIES[t] || {}).label || t) + '</label>';
          }).join('') + '</div></div>';
      }).join('');

      decisionHTML =
        '<form id="req-decide" novalidate>' +
        '<div class="form-errors"></div>' +
        '<h3 class="vh">What approving will do</h3>' +
        consequenceList() +
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
          ? '<p class="chelp" style="margin-top:14px"><strong>The plan is not adjustable on a renewal.</strong> ' +
            'It continues exactly what the institution holds — same experiments, same technologies, same ' +
            'licence count, same term length. For anything different they raise an ordinary access request.</p>'
          : '<details class="canon" id="grant-box" style="margin-top:14px">' +
            '<summary>' + ui.ic('shield', 'sm') +
            '<span class="cn-n">Give this institution less than it asked for</span>' +
            '<span class="cn-c">Optional</span></summary>' +
            '<div class="cn-b"><div class="cbody">' +
            '<p class="chelp">Everything requested is granted unless you clear it here. Nothing on this panel ' +
            'can grant more than was asked for.</p>' +
            /* `field` for the invalid state and the error slot
               `showErrors` writes into; `reqitems` for the row styling. */
            '<div id="grant-items" class="field reqitems">' + allocRows + '</div>' +
            '<div class="frow">' +
            '<div class="field" id="grant-quantity"><label for="gq">Approved users / licences</label>' +
            '<input type="number" id="gq" min="1" step="1" max="' + r.quantity + '" value="' + r.quantity + '">' +
            '<p class="hint">' + r.quantity + ' requested. Cannot be increased.</p></div>' +
            '<div class="field" id="grant-term"><label for="gt">Approved access term</label>' +
            '<select id="gt">' + termOptions.slice(0, termIdx + 1).map(function (t) {
              return '<option value="' + esc(t) + '"' + (t === r.term ? ' selected' : '') + '>' +
                esc((data.term(t) || {}).label || t) + '</option>';
            }).join('') + '</select>' +
            '<p class="hint">' + esc(termLabel) + ' requested. Cannot be extended.</p></div>' +
            '</div></div></div></details>') +
        '<div class="field" id="decision-reason" style="margin-top:16px">' +
        '<label for="dr">Reason for this decision <span class="req">(required)</span></label>' +
        '<textarea id="dr" rows="3" placeholder="The institution reads this on their own request status screen."></textarea>' +
        '<p class="hint">Recorded on the request history and shown to the applicant, for either outcome.</p>' +
        '</div>' +
        '<div class="formact">' +
        '<button class="btn pri" type="button" id="req-approve">' + ui.ic('check') + 'Approve request</button>' +
        '<button class="btn sec" type="button" id="req-moreinfo">' + ui.ic('clock') + 'Request more information</button>' +
        /* The one operator-relevant half of the old "NOT IN THIS BUILD"
           note in the rail: there is no reject, and this is where a
           reviewer looking for one would look. The rest of that note
           explained the absence to a reviewer of the build, not to the
           person deciding. */
        '<span class="formnote">There is no reject. Return it for more information instead.</span>' +
        '</div>' +
        '</form>';
    } else if (r.status === state.STATUS.INFO_REQUESTED) {
      decisionHTML =
        '<div class="decidebar"><span class="db-note">Returned to the institution for more information. It is ' +
        'neither approved nor refused, and comes back to this queue when they resubmit. ' +
        (r.renewsAccessId
          ? 'Access record ' + esc(r.renewsAccessId) + ' still runs to its existing end date.'
          : 'Nothing is activated and no entitlement exists.') +
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
          ? 'Approved, awaiting payment. Access record ' + esc(r.renewsAccessId) + ' is <strong>unchanged</strong> ' +
            'meanwhile: it runs to its existing end date, and the term is extended when payment completes.'
          : 'Approved, awaiting payment. Tenant access is not active yet and no entitlement exists.') +
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
        '</span>' +
        '<a class="btn sec" href="' + (tenant ? P.href.institution(tenant.id) : P.href.institutions()) +
        '">Institution report</a></div>';
    }

    /* RULE A — the overlap comparison. It is a READ MODEL and only a
       read model: it decides nothing, blocks nothing and recommends
       nothing. Every figure on it comes from the access records
       themselves, and it is placed ABOVE the decision, because the
       reviewer used to be asked to decide and then shown the evidence. */
    var comparisonCard = (reqTenant && heldRecords.length)
      ? ui.card('What ' + esc(reqTenant.name) + ' already holds',
          ui.metrics([
            { v: held.length + ' of ' + r.items.length,
              k: 'requested ' + util.plural(r.items.length, 'experiment') + ' already held' },
            { v: heldLive, k: 'of those on a record still running',
              tone: heldLive < held.length ? 'warn' : '' },
            { v: heldRecords.length, k: util.plural(heldRecords.length, 'approval') + ' involved' }
          ]) +
          '<div class="tscroll" style="margin-top:12px"><table class="dt">' +
          '<caption class="sr-only">Approved content ' + esc(reqTenant.name) +
          ' already holds that carry experiments requested here</caption>' +
          '<thead><tr><th scope="col">Approved content</th><th scope="col">Requested experiments it carries</th>' +
          '<th scope="col">Technologies</th><th scope="col">Term</th>' +
          '<th scope="col">Licences</th></tr></thead><tbody>' +
          heldRecords.map(function (entry) {
            var row = entry.row, al = row.allocation;
            return '<tr>' +
              /* CONTENT FIRST. This cell led with `ACC-001` in the row's
                 primary weight, so the reviewer's eye landed on a database
                 key and the badge beneath it read as the row's subject.
                 What identifies a record here is the content it grants;
                 the reference follows, muted, through `ui.accessRef`. */
              '<td data-label="Approved content"><span class="tmain">' + ui.accessTitle(row.record) + '</span>' +
              '<span class="tsub">' + ui.accessScope(row.record) + '</span>' +
              (row.record.id === r.renewsAccessId
                ? '<span class="tsub">' + ui.badge('b-info', 'calendar', 'Renewing this') + '</span>'
                : '') +
              '<span class="tsub">' + esc(P.expiryLine(row.record)) + '</span></td>' +
              '<td data-label="Requested experiments it carries">' +
              entry.experimentIds.map(function (id) {
                var c = data.contextOf(id);
                return esc(c ? c.experiment.name : id);
              }).join('<br>') + '</td>' +
              '<td data-label="Technologies">' + ui.techBadges(entry.technologies) + '</td>' +
              '<td data-label="Term">' + ui.termBadge(row.termState) +
              (row.assignable
                ? ''
                : '<span class="tsub">' + esc(state.assignabilityText(row.reason)) + '</span>') + '</td>' +
              '<td data-label="Licences" class="num">' + al.approved +
              '<span class="tsub">' + al.assigned + ' assigned · ' + al.remaining + ' remaining' +
              (al.over ? ' · ' + al.over + ' beyond' : '') + '</span></td>' +
              '</tr>';
          }).join('') + '</tbody></table></div>' +
          /* WHY THE RECORDS ARE NOT MERGED, in one sentence instead of
             seventy words. The longer version defended the decision to a
             reviewer of the build; an operator needs the rule. */
          '<p class="cardfoot">Licence figures are allocation figures per record, not student counts. One ' +
          'Experiment can sit on more than one record — each carries its own technologies, term and licences, ' +
          'so records are never blended into a single plan.</p>', null, 'h2')
      : '';

    /* RULE D — the renewal banner, as ONE line. It stays at the top of
       the screen rather than only inside the decision block, because a
       request keeps being a renewal after it has been decided and
       somebody reading an approved one later needs the same fact. What
       approving it does is stated once, in the decision panel. */
    var renewalAlert = r.renewsAccessId
      /* §6 — WHAT is being renewed, in the institution's own terms.
         The internal reference is not shown: it tells the reviewer
         nothing they can weigh. Content, technologies, licences and the
         current end date do. The stored linkage is unchanged. */
      ? ui.alertBox('info', 'Renewal — this extends access the institution already holds',
          (renewsRec
            ? '<p><strong>Renewing</strong> ' + ui.accessTitle(renewsRec) +
              (reqTenant
                ? ' for <a href="' + P.href.institution(reqTenant.id) + '">' + esc(reqTenant.name) + '</a>'
                : '') + '</p>' +
              '<p class="tsub">' + ui.techBadges(ui.recTechnologies(renewsRec)) + '</p>' +
              '<p class="tsub">' + renewsRec.quantity + ' ' +
                util.plural(renewsRec.quantity, 'licence') + ' \u00b7 current term ends <strong>' +
                esc(util.fmtDate(renewsRec.endsOn)) + '</strong></p>' +
              '<p>The plan below mirrors it exactly.</p>'
            : '<p><strong>That access is no longer on the platform</strong>, so there is nothing for an ' +
              'approval to extend.</p>'))
      : '';

    var requesterCard = ui.card('Requester',
      '<div class="kv compact">' +
      '<div class="k">Institution</div><div class="v">' + esc(r.institution.name) + '</div>' +
      /* R20 — "(prototype seed)" was prototype bookkeeping printed in an
         identity field. The classification itself is a real operational
         attribute and stays. */
      '<div class="k">Classification</div><div class="v">' +
      esc(r.institution.kind === 'internal' ? 'Internal' : 'External') + '</div>' +
      '<div class="k">Access context</div><div class="v">' + esc(r.institution.accessContext) + '</div>' +
      '<div class="k">Contact (SPOC)</div><div class="v">' + esc(r.institution.contactName) +
      '<span class="tsub2">' + esc(r.institution.contactEmail) + '</span></div>' +
      '<div class="k">Payment</div><div class="v">' +
      (r.paymentRequired ? 'Required after approval' : 'No payment step on this route') + '</div>' +
      '</div>', null, 'h2');

    var html =
      ui.crumbs([{ label: 'Access requests', href: P.href.requests() }, { label: r.id }]) +
      ui.phead('Request ' + r.id,
        esc(r.institution.name) + ' · ' +
        esc(r.institution.kind === 'internal' ? 'Internal institution' : 'External institution') + ' · ' +
        esc(r.institution.accessContext) + ' · submitted ' + esc(util.fmtDate(r.submittedAt)),
        null, ui.statusBadge(r.status) + ' ' +
        (r.renewsAccessId
          ? ui.badge('b-info', 'calendar', 'Renewal')
          : ui.badge('b-neutral', 'doc', 'New request'))) +
      renewalAlert +
      ui.card('Where this request stands',
        ui.track(trackSteps) +
        '<div style="margin-top:14px">' + ui.statStrip([
          { v: r.quantity, k: 'Licences requested' },
          { v: termLabel, k: 'Term requested' },
          { v: r.items.length, k: util.plural(r.items.length, 'Experiment') },
          { v: askedTech, k: 'Technology ' + util.plural(askedTech, 'variant') },
          (reqTenant
            ? { v: held.length + ' / ' + r.items.length, k: 'Already held' }
            : { v: 'New', k: 'Institution on the platform' }),
          { v: queueDays == null ? '—' : queueDays, k: 'Days since submitted' }
        ]) + '</div>', null, 'h2') +
      '<div class="grid-rail">' +
      '<div class="stack">' +
      itemsCard +
      comparisonCard +
      '<section class="card">' +
      '<div class="chead"><h2>Decision</h2>' +
      '<span class="cnote">' + (r.status === state.STATUS.SUBMITTED
        ? 'Approve, or return it for more information'
        : 'Already decided') + '</span></div>' +
      /* THE TWO BRANCHES NEED DIFFERENT PLACEMENT, not one shared slot.
         A `.decidebar` carries its own padding and a bottom radius that
         has to meet the card edge, so it belongs OUTSIDE `.cbody`; the
         decision FORM has no padding of its own and belongs inside it.
         Concatenating both into the same position is how the form came
         to render flush against the card border. */
      (r.status === state.STATUS.SUBMITTED && decideBlock !== 'tenant-inactive'
        ? '<div class="cbody">' + decisionHTML + '</div>'
        : decisionHTML) +
      '</section>' +
      '</div>' +
      '<div class="stack">' +
      requesterCard +
      ui.card('History', timeline, null, 'h2') +
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

        /* An error against a grant field is rendered INSIDE the grant
           editor, which is a collapsed disclosure by default — so the
           summary alert pointed at a message nobody could see, and
           `showErrors` focuses an input that is not rendered. Opening the
           panel is a presentation fix for a presentation bug: nothing
           about which errors are raised, or when, changes. */
        function revealGrantErrors(errs) {
          var box = document.getElementById('grant-box');
          if (!box) { return; }
          var touchesGrant = errs.some(function (e) {
            return e.field === 'grant-items' || e.field === 'grant-quantity' || e.field === 'grant-term';
          });
          if (touchesGrant) { box.open = true; }
        }

        document.getElementById('req-approve').addEventListener('click', function () {
          var grant = readGrant();
          var errs = reasonErrors().concat(state.validateGrant(r, grant).errors);
          revealGrantErrors(errs);
          if (!ui.showErrors(form, errs, 'This decision cannot be recorded yet')) { return; }
          var checked = state.validateGrant(r, grant).grant;
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
          /* Renamed from `routeLine` so it cannot be confused with the
             screen-level route sentence of the same name above: this one
             is the dialog's `.consequence` row, which only the
             confirmation renders. */
          var routeConsequence = r.paymentRequired
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
              narrowLine + routeConsequence + renewalLine,
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
        '<td data-label="Approvals" class="num">' + (pending
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
      /* HOW AN INSTITUTION COMES INTO BEING, as a help line under the
         page title rather than as a tagged gap note under the table.
         The operator-relevant half is this sentence. The rest of the old
         note — "the topology permits a campus to be its own tenant, but
         no source describes the creation form" — answered a question no
         operator has and was addressed to the build team. */
      '<p class="chelp">An institution is created by approving an institutional access request, on either ' +
      'route, at the moment of approval. There is no separate create form, and nothing is ever deleted — an ' +
      'institution that should stop operating is deactivated, reversibly, on its own report.</p>' +
      '<div class="tablecard"><div class="tscroll">' +
      '<table class="dt"><caption class="sr-only">Platform tenants</caption>' +
      '<thead><tr><th scope="col">Institution</th><th scope="col">Classification</th><th scope="col">Tenant Admin</th>' +
      '<th scope="col">Approvals</th><th scope="col">Expiring within 15 days</th><th scope="col">Status</th>' +
      '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div></div>';

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
      /* The operator-relevant half: it records a person, it does not
         create an account. How an identity first comes into being is an
         open question for the build team, not for the person filling
         this form in. */
      '<span class="formnote">Records the assignment against a named person. No account, invitation or ' +
      'credential is created, and nothing is sent.</span></div>' +
      '</form>' +
      (removedAdmins.length
        ? '<p class="cardfoot">Previously assigned: ' + removedAdmins.map(function (a) {
            return esc(a.name) + ' (removed ' + esc(util.fmtDate(a.removedAt)) + ')';
          }).join(', ') + '</p>'
        : ''), null, 'h2');

    /* ---- content access + licences + term ---- */
    var accessRows = rep.access.length
      ? '<div class="tscroll"><table class="dt">' +
        '<caption class="sr-only">Approved content held by ' + esc(t.name) + '</caption>' +
        '<thead><tr><th scope="col">Approved content</th><th scope="col">Experiments</th><th scope="col">Approved users</th>' +
        '<th scope="col">Assigned</th><th scope="col">Term</th><th scope="col">State</th></tr></thead><tbody>' +
        rep.access.map(function (rec) {
          var al = state.accessAllocation(rec.id);
          var term = state.accessTermState(rec);
          var due = state.expiryReminderDue(rec);
          return '<tr>' +
            /* Same correction as the comparison table: the record is named
               by what it grants, not by its key. */
            '<td data-label="Approved content"><span class="tmain">' + ui.accessTitle(rec) + '</span>' +
            '<span class="tsub">' + ui.accessScope(rec) + '</span>' +
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
      '<p class="cardfoot">Licence figures come from the approved request and nothing else — no universal cap, ' +
      'and no revenue or financial metric on any Super Admin surface.</p>', null, 'h2');

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
          /* The counting rules are genuine product help — an operator
             comparing two institutions has to know what the denominator
             is — but they are not needed on first read, so they fold. */
          ui.about('How these figures are counted',
            '<p>The unit is <strong>one student on one experiment</strong>. A student entitled to three ' +
            'experiments counts three times; a student holding the same experiment through two approvals ' +
            'counts once, because it is one piece of work.</p>' +
            '<p><strong>Completed</strong> uses this build&rsquo;s own completion rule — every learning ' +
            'resource, every entitled simulation, and the assessment where one is configured. It is not a ' +
            'confirmed academic completion policy.</p>' +
            '<p><strong>Waiting on Faculty</strong> counts pairings, not individual written answers; one ' +
            'experiment may hold several. No score, index or ranking is produced anywhere.</p>')
        : ui.emptyRow({
            icon: 'bars', heading: 'h3',
            title: 'Nothing to report yet',
            body: 'No student here holds an effective entitlement. Content reaching the tenant entitles nobody; ' +
              'the Tenant Admin still has to assign it.'
          })), null, 'h2');

    /* ---- STK31-25 — student deactivation AS A PLATFORM OVERRIDE ----
       The Tenant Admin owns this day to day; the Super Admin may also
       perform it. It is the same one writer of a student's status, so
       the licence consequence is identical on both planes and there is
       no second kind of "inactive". Nothing else about the student
       changes: no assignment, no access record, no attempt, no review. */
    var studentPeople = state.studentsForTenant(t.id);
    /* DESIGNED FOR MANY, NOT FOR THE SAMPLE DATA. A CSV-imported tenant
       has hundreds of students, and this table had no search, no filter
       and no cap — it simply became the page. The first 25 rows render;
       the rest are revealed on request, and a search box narrows the
       whole set. Both are DOM-only: no state is read or written, no
       re-render is triggered, and no row is removed from the markup, so
       the override buttons keep their handlers throughout. */
    var OVERRIDE_CAP = 25;
    var overrideCard = ui.card('Student access — platform override',
      (studentPeople.length
        ? '<p class="chelp">The same action the Tenant Admin has: an inactive student holds no effective ' +
          'entitlement and their licence returns to the record. Nothing is deleted, and reactivation re-enters ' +
          'the allocation queue at the back, so nobody currently entitled is displaced.</p>' +
          (studentPeople.length > 8
            ? '<div class="toolbar">' +
              '<div class="searchbox">' + ui.ic('search') +
              '<input type="search" id="ovr-q" autocomplete="off" aria-label="Find a student at this institution" ' +
              'placeholder="Find a student by name or id"></div>' +
              '<div class="tb-r"><span class="tb-count" id="ovr-count">' +
              Math.min(OVERRIDE_CAP, studentPeople.length) + ' of ' + studentPeople.length + ' shown</span></div>' +
              '</div>'
            : '') +
          '<div class="tscroll"><table class="dt">' +
          '<caption class="sr-only">Students at ' + esc(t.name) + ', with the platform override</caption>' +
          '<thead><tr><th scope="col">Student</th><th scope="col">Stream / Course</th>' +
          '<th scope="col">Entitlements</th><th scope="col">Status</th>' +
          '<th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody id="ovr-rows">' +
          studentPeople.map(function (p, ix) {
            var m = state.studentCourseMembership(p.id);
            var ents = p.status === 'active' ? state.effectiveEntitlementCount(p.id) : 0;
            var last = (p.overrides || [])[(p.overrides || []).length - 1];
            return '<tr data-sname="' + esc(String(p.name + ' ' + (p.studentId || '') + ' ' + (p.email || ''))
                .toLowerCase()) + '"' +
              (ix >= OVERRIDE_CAP ? ' style="display:none"' : '') + '>' +
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
          '<div id="ovr-none" style="display:none">' +
          ui.emptyRow({ icon: 'search', heading: 'h3', title: 'No student matches that search',
            body: 'Clear the box to see everybody at this institution again.' }) + '</div>' +
          (studentPeople.length > OVERRIDE_CAP
            ? '<div class="formact"><button class="btn sec sm" type="button" id="ovr-more">Show all ' +
              studentPeople.length + ' students</button></div>'
            : '') +
          '<p class="cardfoot">Every override is recorded on the student&rsquo;s record and on this ' +
          'institution&rsquo;s governance history, with the reason given. Nothing is sent to anybody.</p>'
        : ui.emptyRow({
            icon: 'users', heading: 'h3',
            title: 'No students recorded',
            body: 'The Tenant Admin creates student records manually or by CSV import; the platform does not ' +
              'create people.'
          })), null, 'h2');

    /* ---- operational signals ---- */
    var signals = [];
    rep.expiryReminders.forEach(function (rec) {
      signals.push({ tone: 'warn', icon: 'clock',
        /* The signal led with the record key; it now leads with the
           content whose term is lapsing. `title` is escaped by
           `attentionList`, so the plain form is used here and the
           reference rides in the body, which is raw. */
        title: ui.accessTitle(rec, { plain: true }) + ' — expiry reminder due',
        /* The 15-day rule and the "nothing has been sent" fact belong
           together, on the queue that owns them. Restating both on every
           row of every list that mentions an expiry is what made three
           screens carry the same paragraph. */
        /* Institution detail is normal operational UI: no reference. */
        body: esc(P.expiryLine(rec)) + '. Due for the 15-day reminder.',
        href: P.href.operations(), label: 'Operations',
        aria: 'Open operations for the expiring access record ' + rec.id });
    });
    rep.expiredAccess.forEach(function (rec) {
      signals.push({ tone: 'warn', icon: 'alertCirc',
        title: ui.accessTitle(rec, { plain: true }) + ' — access term ended',
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

    var signalCard = ui.card('Needs attention',
      signals.length
        ? P.attentionList(signals)
        : ui.emptyRow({ ok: true, heading: 'h3',
            title: 'Nothing needs attention',
            body: 'No expiring term, no expired access, no open support report and no device request here.' }),
      signals.length ? signals.length + ' ' + util.plural(signals.length, 'item') : null, 'h2');

    /* ---- governance ----
       THE CONSEQUENTIAL ACTION, SEPARATED FROM THE INFORMATION.
       It used to be the last card in the main column, below a student
       table with one row per student and no cap — so on a CSV-imported
       tenant of four hundred students the reversible-deactivate control
       sat four hundred rows down the page. It now sits in the rail, in a
       `dangerZone`, at a fixed position regardless of how many people
       the institution has.

       The IMPACT FIGURE IS ON THE CONTROL, not only in the dialog. It
       used to appear for the first time after the destructive button had
       been pressed, which is the wrong side of the decision. */
    var governance = ui.dangerZone({
      title: inactive ? 'Institution status — deactivated' : 'Institution status — active',
      desc: inactive
        ? 'Reactivating restores access only where the entitlement, allocation and term are still valid. The ' +
          'allocation ordering is untouched, so no student is displaced.'
        : 'Deactivating stops ' + rep.entitledStudents + ' ' +
          util.plural(rep.entitledStudents, 'student') + ' launching learning and stops Faculty using mapped ' +
          'content. It is reversible and deletes nothing: people, groups, mappings, assignments, licences, ' +
          'attempts, reviews and progress are all kept.',
      actionsHTML: (inactive
        ? '<button class="btn pri" type="button" id="ten-reactivate">' + ui.ic('check') + 'Reactivate institution</button>'
        : '<button class="btn dgr" type="button" id="ten-deactivate">' + ui.ic('alertCirc') + 'Deactivate institution</button>') +
        '<span class="formnote">There is no delete. A tenant is never physically removed.</span>'
    });

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
      ui.phead(t.name,
        esc(t.accessContext) + ' · ' + esc(t.kind === 'internal' ? 'Internal' : 'External') +
        ' · ' + rep.people + ' ' + util.plural(rep.people, 'person', 'people') +
        ' · ' + rep.access.length + ' ' + util.plural(rep.access.length, 'approval'),
        null, ' ' + P.tenantBadge(t)) +
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
      /* ORDER OF THE MAIN COLUMN: what needs doing, then what the
         institution is, then what it holds, then how it is being used,
         then the one tenant-owned list this plane can override. The
         governance controls are in the rail — see the `dangerZone`
         comment above for why they no longer sit at the bottom of an
         unbounded table. */
      '<div class="stack">' + signalCard + identity + reach +
      ui.card('Content access, licences and term', accessRows, null, 'h2') +
      usageCard + overrideCard + '</div>' +
      '<div class="stack">' + adminCard + governance + historyCard +
      /* ⚠ PROTOTYPE VIEW SWITCH, not a Super Admin capability, and no
         longer dressed as a page action. It crosses an authority
         altitude: the Super Admin decides what a tenant may use, the
         Tenant Admin decides which student gets what (STK31-24 /
         STK31-25). In the product those are different people signing in
         separately; there is no authentication here, so the link stays
         available for a demo — inside a demo panel, which is what it is. */
      ui.demoPanel('Open this institution as its Tenant Admin',
        '<p>The Tenant Admin workspace is a different role with different authority. There is no ' +
        'authentication in this build, so this link switches the view directly.</p>' +
        '<p><a class="btn sec sm" href="#/tenant/' + encodeURIComponent(t.id) + '/overview">' +
        'Open the Tenant Admin workspace</a></p>') +
      '</div></div>';

    return {
      title: t.name, html: html, navKey: 'institutions',
      after: function () {
        /* THE STUDENT TABLE'S SEARCH AND CAP — DOM ONLY.
           Nothing here reads or writes state and nothing re-renders, so
           the override buttons below keep the handlers wired further
           down this same hook, and a search does not move the caret or
           lose focus the way a re-render would. Rows are hidden with an
           inline `display` rather than the `hidden` attribute because the
           responsive stylesheet gives table rows an explicit `display`
           at narrow widths, which would out-specify the UA's
           `[hidden]` rule. */
        (function wireStudentSearch() {
          var body = document.getElementById('ovr-rows');
          if (!body) { return; }
          var rows = Array.prototype.slice.call(body.querySelectorAll('tr'));
          var input = document.getElementById('ovr-q');
          var countEl = document.getElementById('ovr-count');
          var moreBtn = document.getElementById('ovr-more');
          var noneEl = document.getElementById('ovr-none');
          var showAll = false;

          function apply() {
            var q = String(input ? input.value : '').trim().toLowerCase();
            var matched = 0, visible = 0;
            rows.forEach(function (tr) {
              var hay = tr.getAttribute('data-sname') || '';
              if (q && hay.indexOf(q) === -1) { tr.style.display = 'none'; return; }
              matched += 1;
              /* A search shows every match: a cap that hid results the
                 operator had just searched for would be a lie. */
              var show = showAll || !!q || visible < OVERRIDE_CAP;
              tr.style.display = show ? '' : 'none';
              if (show) { visible += 1; }
            });
            if (countEl) { countEl.textContent = visible + ' of ' + rows.length + ' shown'; }
            if (moreBtn) { moreBtn.style.display = (showAll || q || matched <= OVERRIDE_CAP) ? 'none' : ''; }
            if (noneEl) { noneEl.style.display = matched ? 'none' : ''; }
          }

          if (input) {
            input.addEventListener('input', apply);
            input.addEventListener('search', apply);
          }
          if (moreBtn) {
            moreBtn.addEventListener('click', function () {
              showAll = true;
              apply();
              ui.announce('Showing all ' + rows.length + ' students.');
            });
          }
        })();

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
