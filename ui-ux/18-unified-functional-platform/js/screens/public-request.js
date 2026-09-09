/* ============================================================
   Unified Functional Platform — selection basket + institutional
   request screens.

   Invariants enforced here:
     · CART / SELECTION ≠ ENTITLEMENT — nothing on these screens
       grants access.
     · Every selected experiment carries ≥ 1 technology.
     · One request record per submission; refresh cannot duplicate.
     · The payment route renders ONLY for an external request in
       APPROVED_PAYMENT_REQUIRED — the internal route simply does
       not contain a payment step (STK31-19).
     · The payment step is a SIMULATION. No provider is represented
       and no amount is configured, and the screen says so.
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

  function statusHref(id) { return '#/request-status/' + encodeURIComponent(id); }
  function payHref(id) { return '#/payment/' + encodeURIComponent(id); }

  /* ============================================================
     THE ACADEMIC CONTEXT, RESOLVED DEFENSIVELY.

     `data.contextOf()` returns `{experiment, course, grouping}` where
     COURSE OR GROUPING MAY BE NULL — public-catalogue.js has said so and
     guarded for it since 07.3, while this file dereferenced
     `ctx.grouping.name` straight through at four call sites. The two
     files stated contradictory beliefs about one data shape; they now
     agree. I could construct no reachable path to a dangling reference
     today (nothing deletes a Course or Programme, and `updateCourse`
     rejects a parent that does not resolve), so this is latent rather
     than live — but a screen that throws is the least useful thing a
     requester can be shown, and the guard costs one function.

     ⚠ This duplicates `ctxOf` in public-catalogue.js deliberately: the
     shared modules (components.js / content-ui.js) are owned centrally
     and this pass does not edit them. Promoting it is recorded as a
     follow-up. */
  var UNFILED_GROUP_LABEL = 'Not filed under a programme / department';

  function ctxOf(expId) {
    var ctx = data.contextOf(expId) || {};
    return {
      experiment: ctx.experiment || null,
      course: ctx.course || null,
      grouping: ctx.grouping || null,
      experimentName: ctx.experiment ? ctx.experiment.name : expId,
      courseName: ctx.course ? ctx.course.name : 'Course not resolved',
      groupingName: ctx.grouping ? ctx.grouping.name : UNFILED_GROUP_LABEL
    };
  }

  function contextLineHTML(experimentId) {
    var c = ctxOf(experimentId);
    return esc(c.groupingName) + ' › ' + esc(c.courseName);
  }

  /* One requested / granted / selected experiment, rendered the same way
     wherever it appears: request form rail, status page, payment page
     and the "what was approved" card. */
  function itemRowHTML(item, extraHTML) {
    var c = ctxOf(item.experimentId);
    /* No empty technology column: the expansion block re-uses this row to
       name an experiment whose formats are stated per access record
       underneath, and an empty `.ri-tech` left a gap where a set of
       badges should be. */
    var badges = ui.techBadges(item.technologies || []);
    return '<div class="ri"><div class="ri-body">' +
      '<div class="ri-ctx">' + esc(c.groupingName) + ' › ' + esc(c.courseName) + '</div>' +
      '<div class="ri-t">' + esc(c.experimentName) + '</div>' +
      (extraHTML || '') + '</div>' +
      (badges ? '<div class="ri-tech">' + badges + '</div>' : '') + '</div>';
  }

  /* ============================================================
     EXPANSION OF EXISTING ACCESS — Implementation 07.2, rule A.

     "If the same institution requests the same experiment again, they
      can request additional licenses. It should show the existing plan
      when they reselect."

     A second request for an experiment an institution already holds has
     always been allowed and still is: nothing below blocks, disables or
     pre-fills anything. What these helpers add is the sentence the
     build never said — that such a request is an EXPANSION of access
     already in place rather than an accidental repeat of it.

     ⚠ WHETHER AN EXPANSION MAY ALSO ADD TECHNOLOGY VARIANTS THE
     INSTITUTION DOES NOT HOLD, OR CHANGE THE ACCESS TERM, IS NOT
     SETTLED. That was previously stated to the requester in a
     `gapNote` headed "EXPANSION SCOPE NOT SETTLED" at the top of the
     institutional request form — requirements-status commentary
     addressed to the project team, on a stakeholder-facing conversion
     screen. It is recorded here instead. This build encodes no rule in
     either direction: every technology stays selectable on the
     selection page, every access term stays choosable on the form, and
     nothing is disabled, hidden or pre-filled because an institution
     already holds an experiment. A redesign that rendered held
     technologies differently from unheld ones would answer the open
     question by accident, so none does.
     ============================================================ */

  /* One access record, named. Everything here is read from the record
     itself, so an expired record reads as expired and a record that
     narrows what was asked for reads as what was actually granted. */
  function recordPhrase(rec) {
    var termDef = data.term(rec.term);
    var termState = state.accessTermState(rec);
    /* The phrase opened with the record key, so a sentence about what an
       institution keeps began with a database reference. It names the
       content first; the reference closes the parenthesis. */
    return ui.accessTitle(rec) + ' (' + rec.quantity + ' ' + util.plural(rec.quantity, 'licence') + ', ' +
      esc(termDef ? termDef.label : rec.term) +
      (rec.endsOn ? ' until ' + esc(util.fmtDate(rec.endsOn)) : '') +
      ', ' + esc(termState.label) + ')';
  }

  /* THE "UNAFFECTED" SENTENCE, NAMED.

     Both decision surfaces told the institution that access it already
     held was unaffected, and both said it in the abstract — which is
     the least useful place to be vague, because a second request for an
     experiment the institution already holds is exactly when the reader
     wants to know WHICH records those are and that they are still
     theirs, untouched, whatever happens to the request on screen.

     When the request's institution does not resolve — the ordinary
     state of a first request, before any tenant exists — the sentence
     stays the generality it has always been. It does NOT claim there is
     no other access: the lookup is a seeded-id-then-name match and
     cannot support that inference.

     "Earlier" became "other" deliberately. The records are selected by
     which request wrote them, not by date, and an institution's second
     request can be activated before a first one still sitting at the
     payment step — so calling every other record "earlier" would state
     an ordering the screen has not checked. */
  function unaffectedHTML(r) {
    var tenant = state.resolveRequestTenant(r);
    if (!tenant) {
      return '<p>Any access the institution already holds under another request is ' +
        'unaffected and continues exactly as it is.</p>';
    }
    /* Records written by THIS request are not other access — on the
       payment step there are none yet, and after activation the record
       this request created must not be listed as something it leaves
       alone. */
    var others = state.accessForTenant(tenant.id).filter(function (rec) {
      /* THE RECORD A RENEWAL RENEWS IS NOT "OTHER ACCESS", and it is
         emphatically not unaffected — it is the one thing this request
         changes. It carries the ORIGINAL request's id, so the
         `requestId` test above cannot exclude it, and without this a
         renewal told the institution that the very record it is
         renewing "continues exactly as it is". */
      return rec.requestId !== r.id && rec.id !== r.renewsAccessId;
    });
    /* What this request does to the record it renews, stated plainly. */
    var renewed = r.renewsAccessId ? state.accessById(r.renewsAccessId) : null;
    var renewalLine = renewed
      ? '<p>This is a <strong>renewal</strong> of ' + recordPhrase(renewed) + '. ' +
        'Nothing about it changes until this request completes: the same experiments, the same technologies ' +
        'and the same licence quantity continue, and only then does its access term move forward. ' +
        'No second set of access is created, so every student already assigned under it stays assigned.</p>'
      : '';
    if (!others.length) {
      return renewalLine + '<p>' + esc(tenant.name) +
        ' holds nothing from any other request, so there is nothing else for this one to affect.</p>';
    }
    return renewalLine + '<p>Access ' + esc(tenant.name) +
      ' already holds under its other requests is ' +
      'unaffected and continues exactly as it is — ' + others.map(recordPhrase).join('; ') + '. ' +
      'Each record keeps its own technologies, term and licence quantity.</p>';
  }

  /* ---------------- selection basket ---------------- */
  XRSLP.screens.selection = function () {
    var items = state.selectionItems();

    if (!items.length) {
      var emptyHtml =
        ui.phead('Selection') +
        '<div class="tablecard">' +
        ui.emptyState({
          icon: 'basket',
          title: 'Your selection is empty',
          body: 'Browse the catalogue and add experiments — with the technology formats your institution needs — to prepare an institutional access request.',
          actionsHTML: '<a class="btn pri" href="#/catalogue">Browse catalogue</a>'
        }) + '</div>';
      return { title: 'Selection', html: emptyHtml, navKey: 'selection' };
    }

    var techCount = items.reduce(function (n, i) { return n + i.technologies.length; }, 0);

    var rows = items.map(function (item) {
      var c = ctxOf(item.experimentId);
      var e = c.experiment;
      var lockId = 'lock-' + esc(item.experimentId);
      /* THE RULE IS LEGIBLE BEFORE IT IS HIT. Unchecking the last format
         used to silently re-check the box and write an error underneath
         the fieldset: the control visibly rejected the reader's action
         and reverted itself, which reads as a broken checkbox rather
         than as an enforced rule. The last remaining format is locked
         instead, and the line below says what to do instead.

         ⚠ THE WRITE-PATH GUARD STAYS. `state.selectionSetTech` refuses
         an empty list, and the change handler below still refuses one
         too — the lock is the explanation, not the enforcement. */
      var locked = item.technologies.length === 1;
      var checks = data.sortTech(e.technologies).map(function (t) {
        var def = data.TECHNOLOGIES[t];
        var checked = item.technologies.indexOf(t) !== -1;
        var lockThis = locked && checked;
        var id = 'sel-' + esc(item.experimentId) + '-' + esc(t);
        return '<label for="' + id + '"' + (lockThis ? ' class="locked"' : '') + '>' +
          '<input type="checkbox" id="' + id + '" data-exp="' + esc(item.experimentId) + '" value="' + esc(t) + '"' +
          (checked ? ' checked' : '') +
          (lockThis ? ' disabled aria-describedby="' + lockId + '"' : '') + '>' +
          /* Badge plus the full name only where it adds one: `def.name`
             for Web is "Web", which is what the badge already says. The
             old label built "Web — Web" out of the same two values. */
          ui.fmtBadge(t) + (def.name !== def.label ? '<span>' + esc(def.name) + '</span>' : '') + '</label>';
      }).join('');
      return '<article class="selrow" id="row-' + esc(item.experimentId) + '">' +
        '<div class="sr-top"><div>' +
        '<div class="sr-ctx">' + contextLineHTML(item.experimentId) + '</div>' +
        '<h3><a href="#/experiment/' + encodeURIComponent(item.experimentId) + '">' +
        esc(c.experimentName) + '</a></h3>' +
        '</div>' +
        '<button class="btn sm sec sr-remove" type="button" data-remove="' + esc(item.experimentId) + '">' +
        ui.ic('x', 'sm') + 'Remove</button></div>' +
        '<fieldset class="sr-tech"><legend>Technology formats for this experiment</legend>' +
        '<div class="techchecks">' + checks + '</div>' +
        (locked
          ? '<p class="sr-lock" id="' + lockId + '">At least one format is required. To drop this ' +
            'experiment from the request, use Remove.</p>'
          : '') +
        '<div class="sr-err" id="err-' + esc(item.experimentId) + '"></div>' +
        '</fieldset></article>';
    }).join('');

    var html =
      ui.phead('Selection', ui.metrics([
        { v: items.length, k: XRSLP.util.plural(items.length, 'experiment') },
        { v: techCount, k: 'technology ' + util.plural(techCount, 'selection') }
      ])) +
      '<div class="selgrid">' +
      '<div class="stack" id="sel-rows">' + rows + '</div>' +
      '<aside class="sumcard" aria-labelledby="sum-h">' +
      '<div class="sc-head" id="sum-h">Your selection</div>' +
      '<div class="sc-body">' +
      '<div class="sumline"><span>Experiments</span><span class="sl-v">' + items.length + '</span></div>' +
      '<div class="sumline"><span>Technology selections</span><span class="sl-v">' + techCount + '</span></div>' +
      '</div>' +
      '<div class="sc-act">' +
      '<a class="btn pri blk" href="#/request">' + ui.ic('arrowR') + 'Prepare institutional request</a>' +
      '<a class="btn gho blk" href="#/catalogue">Continue browsing</a>' +
      '</div>' +
      /* THE PRODUCT INVARIANT, AT A READABLE SIZE, BESIDE THE ACTION.
         It used to be the first clause of a 12px grey strip below the
         CTAs, sharing a box with a build caveat about pricing. A
         selection is not access; that is the load-bearing claim of the
         whole public plane and it is not fine print. */
      '<div class="sc-say"><strong>A selection is not access.</strong> Submitting the institutional ' +
      'request sends it for platform review; access activates only after approval — and payment, ' +
      'where it applies.</div>' +
      '<div class="sc-legal">No pricing is shown: commercial amounts are not configured in this prototype.</div>' +
      '</aside></div>';

    return {
      title: 'Selection',
      html: html,
      navKey: 'selection',
      after: function () {
        Array.prototype.slice.call(document.querySelectorAll('[data-remove]')).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-remove');
            var e = data.experiment(id);
            state.selectionRemove(id);
            ui.toast((e ? e.name : 'Experiment') + ' removed from your selection.', 'info');
            XRSLP.render(true);
            ui.focusMain(true);
          });
        });
        Array.prototype.slice.call(document.querySelectorAll('.techchecks input')).forEach(function (box) {
          box.addEventListener('change', function () {
            var expId = box.getAttribute('data-exp');
            var chosen = Array.prototype.slice.call(
              document.querySelectorAll('.techchecks input[data-exp="' + expId + '"]:checked')
            ).map(function (i) { return i.value; });
            var errBox = document.getElementById('err-' + expId);
            if (!chosen.length) {
              /* At least one technology must stay selected (request
                 invariant). The last remaining box is rendered disabled,
                 so this path should now be unreachable through the UI —
                 it is kept because the rule is the state layer's, not
                 the markup's, and a guard that only exists in an
                 attribute is one DOM change away from gone. */
              box.checked = true;
              if (errBox) {
                errBox.innerHTML = '<div class="ferr" role="alert">' + ui.ic('alertCirc', 'sm') +
                  'At least one technology format must stay selected. Remove the experiment instead if it is no longer needed.</div>';
              }
              return;
            }
            if (errBox) { errBox.innerHTML = ''; }
            state.selectionSetTech(expId, chosen);
            var boxId = box.id;
            XRSLP.render(true);
            var again = document.getElementById(boxId);
            /* The box the reader acted on is never the one that becomes
               locked — unchecking leaves a DIFFERENT box as the last
               one, and checking unlocks rather than locks. The guard is
               belt and braces: focus must never be sent to a disabled
               control, which would silently drop it to the document. */
            if (again && !again.disabled) { again.focus(); }
            else { ui.focusMain(true); }
            ui.announce('Technology selection updated.');
          });
        });
      }
    };
  };

  /* ============================================================
     THE ACCESS ROUTE — read the same way `state.submitRequest` reads it.

     Whether the institution will be asked to pay is the one fact on the
     request form with commercial consequences, and it used to be the
     second sentence of a 13px grey box, computed ONCE from the
     prototype scenario and then never recomputed while the visitor
     typed. `submitRequest` does not work that way: it resolves the
     institution FROM THE NAME IN THE FORM and takes the route from that
     institution's own origin request, consulting the scenario only for
     a name the platform does not recognise.

     This mirrors that derivation exactly so the statement on screen is
     the route the submit will actually take. It is READ-ONLY — it
     resolves nothing, writes nothing and decides nothing; the authority
     stays in state.js. A `state.requestRouteFor(name)` would remove the
     duplication and is recorded as a follow-up.
     ============================================================ */
  function routeFor(name, sc) {
    var n = String(name == null ? '' : name).trim();
    var known = n ? state.requesterTenant(n) : null;
    if (known) {
      var origin = state.originRequestFor(known.id);
      return {
        tenant: known,
        accessContext: known.accessContext,
        paymentRequired: origin ? !!origin.paymentRequired : known.kind === 'external'
      };
    }
    return {
      tenant: null,
      accessContext: sc.institution.accessContext,
      paymentRequired: sc.institution.paymentRequired
    };
  }

  /* The route as a statement of record plus the steps it runs through.
     The internal / BITS Community route contains no payment step at any
     point, and the track says so rather than greying one out. */
  function routeCardHTML(route) {
    var steps = route.paymentRequired
      ? [
          { t: 'Submit this request', d: 'You are here', state: 'live' },
          { t: 'Platform review', d: 'A reviewer approves, declines or asks for more information', state: 'todo' },
          { t: 'Payment', d: 'Simulated in this prototype', state: 'todo' },
          { t: 'Access activated', d: 'For your institution', state: 'todo' }
        ]
      : [
          { t: 'Submit this request', d: 'You are here', state: 'live' },
          { t: 'Platform review', d: 'A reviewer approves, declines or asks for more information', state: 'todo' },
          { t: 'Access activated', d: 'No payment step on this route', state: 'todo' }
        ];
    return '<div class="routecard">' +
      '<div class="rc-k">Access route</div>' +
      '<div class="rc-t">' + esc(route.accessContext) +
      ui.badge(route.paymentRequired ? 'b-warning' : 'b-success',
        route.paymentRequired ? 'card' : 'check',
        route.paymentRequired ? 'Payment required after approval' : 'No payment step') + '</div>' +
      '<p class="rc-d">' + (route.paymentRequired
        ? 'After the platform approves this request, payment is required before access is activated. ' +
          'No amount is shown — commercial amounts are not configured in this prototype, and the payment ' +
          'step is simulated.'
        : 'No payment step applies to this access context. After the platform approves this request, ' +
          'access is activated for your institution directly.') + '</p>' +
      ui.track(steps) +
      '</div>';
  }

  /* THE EXPANSION STATEMENT. Recomputed whenever the institution name
     changes, because it names that institution's own access records —
     licence quantities, terms and record ids. Reading it once at render
     and never again meant a visitor who cleared the prefilled name and
     typed their own institution kept reading a headline naming a
     DIFFERENT institution, with that institution's records listed
     underneath: exactly the leak the resolution was added to close. */
  function expansionHTML(inst, items) {
    if (!inst) { return ''; }
    var heldSel = state.heldSelectionFor(inst.id, items);
    if (!heldSel.length) { return ''; }

    /* An institution whose records have all expired still has an access
       history for these experiments, and it still matters that this
       request adds to it rather than repeating it — but it does not
       "already hold" anything, so the heading does not say so. */
    var anyLive = heldSel.some(function (h) {
      return h.rows.some(function (row) { return row.live; });
    });
    var anyExpired = heldSel.some(function (h) {
      return h.rows.some(function (row) { return !row.live; });
    });

    var heldRowsHTML = heldSel.map(function (h) {
      return itemRowHTML(
        { experimentId: h.experimentId, technologies: [] },
        h.rows.map(function (row) {
          return '<div class="ri-ctx ri-held">Held under ' + recordPhrase(row.record) + ' — ' +
            ui.techBadges(row.technologies) + '</div>';
        }).join(''));
    }).join('');

    return ui.alertBox('info',
      anyLive
        ? 'This request expands access ' + inst.name + ' already holds'
        : 'This request adds to access ' + inst.name + ' has held before',
      '<p>' + esc(inst.name) + ' is already approved for ' + heldSel.length + ' ' +
      util.plural(heldSel.length, 'experiment') + ' in this selection. Submitting this request asks for ' +
      '<strong>additional licences</strong> alongside the records below — nothing already held is replaced, ' +
      'reduced or ended, and approval would add further access beside what exists.</p>' +
      '<div class="reqitems">' + heldRowsHTML + '</div>' +
      (anyExpired
        ? '<p>A record shown as <strong>Expired</strong> is listed because it is part ' +
          'of this institution&rsquo;s access history. While it is expired it grants nothing.</p>'
        : ''));
  }

  /* The licence arithmetic the requester is actually doing, stated once
     and derived rather than typed. `tenantAllocation().approved` is a
     SUM OF APPROVED LICENCES across the institution's live access
     records — an allocation figure, never a count of students, and it
     is labelled that way because the same number read as "students" has
     already caused one contradiction elsewhere in this build. */
  function qtyExpansionHTML(inst, rawQty) {
    var alloc = inst ? state.tenantAllocation(inst.id) : null;
    if (!alloc || !alloc.records) { return ''; }
    var raw = String(rawQty == null ? '' : rawQty).trim();
    var q = parseInt(raw, 10);
    var asks = (raw !== '' && !isNaN(q) && q > 0 && String(q) === raw)
      ? 'this request asks for a further <strong>' + q + '</strong> ' + util.plural(q, 'licence') + ' on top of that'
      : 'the quantity entered above is a further licence figure on top of that';
    return esc(inst.name) + ' currently holds <strong>' + alloc.approved + '</strong> approved ' +
      util.plural(alloc.approved, 'licence') + ' across ' + alloc.records + ' live access ' +
      util.plural(alloc.records, 'record') + ', and ' + asks +
      '. These are licence figures, not student counts.';
  }

  /* The selected content, with the records the resolved institution
     already holds named against each item. Recomputed with the
     institution, for the same reason the expansion statement is. */
  function selectedItemsHTML(items, inst) {
    var heldByExp = {};
    if (inst) {
      state.heldSelectionFor(inst.id, items).forEach(function (h) { heldByExp[h.experimentId] = h.rows; });
    }
    return items.map(function (item) {
      var heldRows = heldByExp[item.experimentId];
      return itemRowHTML(item, heldRows
        ? '<div class="ri-ctx ri-held">Already held under ' +
          heldRows.map(function (row) { return esc(row.record.id); }).join(', ') + '</div>'
        : '');
    }).join('');
  }

  /* ---------------- institutional request form ---------------- */
  XRSLP.screens.requestForm = function () {
    var items = state.selectionItems();
    if (!items.length) { return { redirect: '#/selection' }; }

    var sc = state.scenario();
    var draft = state.draft() || {};
    var techCount = items.reduce(function (n, i) { return n + i.technologies.length; }, 0);

    var initialName = draft.institutionName != null ? draft.institutionName : sc.institution.name;
    var route = routeFor(initialName, sc);
    var inst = route.tenant;

    var termRadios = data.TERMS.map(function (t) {
      var checked = draft.term === t.id;
      return '<div class="radiorow"><input type="radio" name="term" id="term-' + esc(t.id) + '" value="' + esc(t.id) + '"' +
        (checked ? ' checked' : '') + '>' +
        '<label for="term-' + esc(t.id) + '"><span class="rr-t">' + esc(t.label) + '</span>' +
        /* Derived from the term's own `months`, which is what
           `activateRequest` adds to the activation date to write
           `endsOn`. Nothing else about a term is specified anywhere, so
           nothing else is claimed. */
        '<span class="rr-n">Access runs for ' + t.months + ' ' + util.plural(t.months, 'month') +
        ' from the date it is activated.</span></label></div>';
    }).join('');

    var qtyLine = qtyExpansionHTML(inst, draft.quantity);

    var html =
      ui.crumbs([{ label: 'Selection', href: '#/selection' }, { label: 'Institutional request' }]) +
      ui.phead('Institutional access request',
        'Review the selection, provide your institution details, and submit for platform review.') +
      '<div class="reqlayout">' +
      '<div class="stack">' +
      /* The route first: it is the consequential fact, and the reader
         should meet it before the fields rather than in the middle of
         them. The prototype caveat sits under it, subordinate to the
         statement rather than between the statement and the first
         input. */
      '<div id="req-route">' + routeCardHTML(route) + '</div>' +
      ui.protoNote('The access context comes from the seeded requester scenario in Prototype controls, or from ' +
        'the institution named below where the platform already knows it. The production rule that classifies ' +
        'an institution as internal or external is not implemented in this prototype.') +
      '<div id="req-expansion">' + expansionHTML(inst, items) + '</div>' +
      '<form id="req-form" novalidate>' +
      '<section class="card"><div class="chead"><h2>Institution &amp; contact</h2></div><div class="cbody">' +
      /* Every field on this form is required, so marking each one with a
         red asterisk carried no information — and the asterisks were
         `aria-hidden` with no `required` attribute behind them, so they
         carried none at all to assistive technology. Said once, and put
         on the inputs where it survives without the marker. */
      '<p class="chelp">All fields are required.</p>' +
      '<div class="form-errors"></div>' +
      '<div class="field" id="f-inst">' +
      '<label for="in-inst">Institution / organisation name</label>' +
      '<input type="text" id="in-inst" autocomplete="organization" required aria-required="true" value="' +
      esc(initialName) + '">' +
      '</div>' +
      '<div class="frow">' +
      '<div class="field" id="f-contact">' +
      '<label for="in-contact">Contact person (SPOC)</label>' +
      '<input type="text" id="in-contact" autocomplete="name" required aria-required="true" value="' +
      esc(draft.contactName != null ? draft.contactName : sc.institution.contactName) + '">' +
      '</div>' +
      '<div class="field" id="f-email">' +
      '<label for="in-email">Contact email</label>' +
      '<input type="email" id="in-email" autocomplete="email" inputmode="email" required aria-required="true" value="' +
      esc(draft.contactEmail != null ? draft.contactEmail : sc.institution.contactEmail) + '">' +
      '</div></div>' +
      '</div></section>' +
      '<section class="card"><div class="chead"><h2>Access requirements</h2></div><div class="cbody">' +
      '<div class="field" id="f-qty">' +
      '<label for="in-qty">Licences required</label>' +
      '<input type="number" id="in-qty" min="1" step="1" inputmode="numeric" required aria-required="true" ' +
      'aria-describedby="qty-hint qty-expansion" value="' +
      esc(draft.quantity != null ? draft.quantity : '') + '">' +
      '<div class="hint" id="qty-hint">How many learners and staff need access under this request. One figure ' +
      'covers every experiment in the request, it is specific to this request, and there is no platform-wide cap.</div>' +
      '<div class="hint" id="qty-expansion"' + (qtyLine ? '' : ' hidden') + '>' + qtyLine + '</div>' +
      '</div>' +
      '<fieldset class="fgroup field termgroup" id="f-term"><legend>Access term</legend>' +
      termRadios +
      '</fieldset>' +
      '</div></section>' +
      '<div class="submitbar">' +
      '<button class="btn pri lg" type="submit" form="req-form" id="req-submit">' + ui.ic('arrowR') +
      'Submit institutional request</button>' +
      '<p class="sb-n">Submitting sends the request for platform review. <strong>No access is granted</strong> ' +
      'until it is approved and, where payment applies, completed.</p>' +
      '</div>' +
      '</form>' +
      '</div>' +
      '<aside class="req-side">' +
      '<section class="card"><div class="chead"><h2>Selected content</h2>' +
      '<span class="cnote">' + items.length + ' ' + util.plural(items.length, 'experiment') + ' · ' +
      techCount + ' ' + util.plural(techCount, 'format') + '</span></div>' +
      '<div class="cbody"><div class="reqitems" id="req-items">' + selectedItemsHTML(items, inst) + '</div>' +
      '<p class="cardfoot">To change the content or technology formats, ' +
      '<a href="#/selection">return to the selection</a>.</p>' +
      '</div></section>' +
      '</aside>' +
      '</div>';

    return {
      title: 'Institutional request',
      html: html,
      navKey: 'selection',
      after: function () {
        var form = document.getElementById('req-form');
        var submitting = false;
        /* The institution the page is currently DESCRIBING. Everything
           derived from it is refreshed together when it changes, so the
           route, the expansion statement, the licence arithmetic and the
           held-record markers can never disagree with each other or with
           the name in the field. */
        var shownInstId = inst ? inst.id : null;

        function currentFields() {
          var qtyRaw = document.getElementById('in-qty').value;
          var termInput = form.querySelector('input[name="term"]:checked');
          return {
            institutionName: document.getElementById('in-inst').value.trim(),
            contactName: document.getElementById('in-contact').value.trim(),
            contactEmail: document.getElementById('in-email').value.trim(),
            quantityRaw: qtyRaw,
            term: termInput ? termInput.value : null
          };
        }

        function setQtyLine(instNow, rawQty) {
          var el = document.getElementById('qty-expansion');
          if (!el) { return; }
          var text = qtyExpansionHTML(instNow, rawQty);
          el.innerHTML = text;
          el.hidden = !text;
        }

        /* Re-resolve and repaint IN PLACE rather than re-rendering the
           screen: a re-render on blur would take focus away from the
           field the reader has just tabbed into. */
        function refreshInstitution(f) {
          var routeNow = routeFor(f.institutionName, sc);
          var instNow = routeNow.tenant;
          var idNow = instNow ? instNow.id : null;
          if (idNow === shownInstId) { setQtyLine(instNow, f.quantityRaw); return; }
          shownInstId = idNow;
          var routeBox = document.getElementById('req-route');
          if (routeBox) { routeBox.innerHTML = routeCardHTML(routeNow); }
          var expBox = document.getElementById('req-expansion');
          if (expBox) { expBox.innerHTML = expansionHTML(instNow, items); }
          var itemBox = document.getElementById('req-items');
          if (itemBox) { itemBox.innerHTML = selectedItemsHTML(items, instNow); }
          setQtyLine(instNow, f.quantityRaw);
        }

        /* Draft persistence — the DRAFT state of the request record. */
        form.addEventListener('input', function () {
          var f = currentFields();
          setQtyLine(routeFor(f.institutionName, sc).tenant, f.quantityRaw);
          state.draftSave({
            institutionName: f.institutionName,
            contactName: f.contactName,
            contactEmail: f.contactEmail,
            quantity: f.quantityRaw,
            term: f.term
          });
        });

        /* `change` on a text input fires when the value is committed and
           focus leaves it, which is exactly when a new institution name
           becomes a claim worth acting on. */
        var instInput = document.getElementById('in-inst');
        if (instInput) {
          instInput.addEventListener('change', function () { refreshInstitution(currentFields()); });
          instInput.addEventListener('blur', function () { refreshInstitution(currentFields()); });
        }

        form.addEventListener('submit', function (evt) {
          evt.preventDefault();
          if (submitting) { return; }
          var f = currentFields();
          var errs = [];
          if (!f.institutionName) { errs.push({ field: 'f-inst', message: 'Enter the institution or organisation name.' }); }
          if (!f.contactName) { errs.push({ field: 'f-contact', message: 'Enter a contact person for this request.' }); }
          if (!f.contactEmail) { errs.push({ field: 'f-email', message: 'Enter a contact email address.' }); }
          else if (!util.isEmail(f.contactEmail)) { errs.push({ field: 'f-email', message: 'Enter a valid email address, e.g. name@institution.example.' }); }
          var qty = parseInt(f.quantityRaw, 10);
          if (f.quantityRaw === '' || isNaN(qty)) { errs.push({ field: 'f-qty', message: 'Enter the number of licences required.' }); }
          else if (qty <= 0 || String(qty) !== String(f.quantityRaw).trim()) { errs.push({ field: 'f-qty', message: 'The licence quantity must be a whole number greater than zero.' }); }
          if (!f.term) { errs.push({ field: 'f-term', message: 'Choose an access term — Monthly, Quarterly or Yearly.' }); }

          if (!ui.showErrors(form, errs, 'The request cannot be submitted yet')) { return; }

          submitting = true;
          document.getElementById('req-submit').setAttribute('disabled', 'disabled');
          var req = state.submitRequest({
            institutionName: f.institutionName,
            contactName: f.contactName,
            contactEmail: f.contactEmail,
            quantity: qty,
            term: f.term
          });
          ui.toast('Request ' + req.id + ' submitted for platform review.');
          XRSLP.router.go(statusHref(req.id));
        });
      }
    };
  };

  /* ---------------- request list (per requester scenario) ---------------- */
  XRSLP.screens.requestList = function () {
    var sc = state.scenario();
    var reqs = state.requestsForScenario(sc.id).slice().reverse();

    var body;
    if (!reqs.length) {
      body = '<div class="tablecard">' + ui.emptyState({
        icon: 'doc',
        title: 'No requests yet',
        body: 'When ' + sc.institution.name + ' submits an institutional access request, it appears here with its review state.',
        actionsHTML: '<a class="btn pri" href="#/catalogue">Browse catalogue</a>'
      }) + '</div>';
    } else {
      var rows = reqs.map(function (r) {
        return '<tr>' +
          '<td data-label="Request"><a class="rowlink" href="' + statusHref(r.id) + '">' +
          '<span class="tmain">' + esc(r.id) + '</span>' +
          '<span class="tsub">Submitted ' + esc(util.fmtDate(r.submittedAt)) + '</span></a></td>' +
          '<td data-label="Experiments" class="num">' + r.items.length + '</td>' +
          /* "Licences", here as everywhere else. This column read
             "Users" while the same figure is a licence allocation on the
             form, in the request details and in the quantity hint, which
             explicitly disclaims it as a student count. */
          '<td data-label="Licences" class="num">' + r.quantity + '</td>' +
          '<td data-label="Term">' + esc((data.term(r.term) || {}).label || r.term) + '</td>' +
          '<td data-label="Status">' + ui.statusBadge(r.status) + '</td>' +
          '<td class="cell-actions"><a class="btn sm sec" href="' + statusHref(r.id) + '">Open</a></td>' +
          '</tr>';
      }).join('');
      body = '<div class="tablecard"><div class="tscroll">' +
        '<table class="dt"><caption class="sr-only">Institutional access requests submitted by ' + esc(sc.institution.name) + '</caption>' +
        '<thead><tr><th scope="col">Request</th><th scope="col">Experiments</th><th scope="col">Licences</th>' +
        '<th scope="col">Term</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div></div>';
    }

    var html =
      ui.phead('Institutional requests', 'Requests submitted by ' + esc(sc.institution.name) + '.') +
      body +
      '<div class="pubnote">' +
      ui.protoNote('In production, an institution sees only its own requests after signing in. This prototype has no ' +
        'authentication: the list shows the requests of the requester scenario chosen in Prototype controls.') +
      '</div>';

    return { title: 'Institutional requests', html: html, navKey: 'requests' };
  };

  /* WHAT THE PLATFORM APPROVED, on the applicant's own screen, on both
     routes. This used to render ONLY when the grant narrowed the
     request, so an institution whose request was approved in full was
     never told what it now holds — the only record on the page was
     "Requested content", which by name describes the ask and not the
     grant. */
  function approvedCard(r) {
    var narrowed = state.grantNarrowsRequest(r);
    var g = r.grant || { items: r.items, quantity: r.quantity, term: r.term };
    var termLabel = (data.term(g.term) || {}).label || g.term;

    /* When the grant matches the request there is nothing to compare, so
       the card states the figures once and points at the content list
       below rather than printing a second identical copy of it. */
    if (!narrowed) {
      return ui.card('What was approved',
        '<p class="chelp">Approved exactly as requested. The experiments and technology formats are ' +
        'listed under <strong>Requested content</strong> below.</p>' +
        ui.metrics([
          { v: g.items.length, k: util.plural(g.items.length, 'experiment') },
          { v: g.quantity, k: util.plural(g.quantity, 'licence') },
          { v: termLabel, k: 'access term' }
        ]) +
        '<p class="cardfoot">To change what the institution holds, submit a new institutional request. ' +
        'Nothing on this page grants access on its own.</p>', null, 'h2');
    }

    return ui.card('What was approved',
      '<p class="chelp">The platform approved <strong>less</strong> than this request asked for. These are ' +
      'the approved figures; the original request is shown below, unchanged.</p>' +
      '<div class="kv">' +
      '<div class="k">Experiments</div><div class="v">' + g.items.length +
      (g.items.length !== r.items.length
        ? ' <span class="muted">(' + r.items.length + ' requested)</span>' : '') + '</div>' +
      '<div class="k">Licences</div><div class="v">' + g.quantity +
      (g.quantity !== r.quantity
        ? ' <span class="muted">(' + r.quantity + ' requested)</span>' : '') + '</div>' +
      '<div class="k">Access term</div><div class="v">' + esc(termLabel) +
      (g.term !== r.term
        ? ' <span class="muted">(' + esc((data.term(r.term) || {}).label || r.term) + ' requested)</span>' : '') +
      '</div></div>' +
      '<div class="reqitems">' + g.items.map(function (item) {
        return itemRowHTML(item);
      }).join('') + '</div>' +
      '<p class="cardfoot">To change what the institution holds, submit a new institutional request. ' +
      'Nothing on this page grants access on its own.</p>', null, 'h2');
  }

  /* ============================================================
     THE HISTORY MARKER.

     Request history carries `event`, `who`, `at` and `note` and — unlike
     the content and governance histories — NO `kind` field, so the
     marker is derived from the platform's own event vocabulary (every
     string matched below is written by js/state.js).

     ⚠ WHY THIS EXISTS AT ALL. The old timeline drew a GREEN TICK on
     every entry except the last, so a request that was returned for more
     information and resubmitted rendered "More information requested"
     with a success marker — the timeline visually said the platform had
     approved it. Anything unrecognised now falls through to a neutral
     marker rather than to a tick.
     ============================================================ */
  function historyMark(h) {
    var t = String(h.event || '').toLowerCase();
    if (t.indexOf('more information requested') === 0) { return { dot: 'warn', icon: 'alert' }; }
    if (t.indexOf('payment declined') === 0) { return { dot: 'warn', icon: 'alertCirc' }; }
    if (t.indexOf('payment outcome not confirmed') === 0) { return { dot: 'warn', icon: 'alertCirc' }; }
    if (t.indexOf('approved — payment required') === 0) { return { dot: 'warn', icon: 'card' }; }
    if (t.indexOf('approved') === 0) { return { dot: 'good', icon: 'check' }; }
    if (t.indexOf('payment completion simulated') === 0) { return { dot: 'good', icon: 'card' }; }
    if (t.indexOf('tenant access activated') === 0) { return { dot: 'good', icon: 'check' }; }
    if (t.indexOf('renewal activated') === 0) { return { dot: 'good', icon: 'check' }; }
    if (t.indexOf('institution created') === 0) { return { dot: 'info', icon: 'building' }; }
    if (t.indexOf('matched to the existing institution') === 0) { return { dot: 'info', icon: 'building' }; }
    if (t.indexOf('request submitted') === 0) { return { dot: 'info', icon: 'doc' }; }
    if (t.indexOf('resubmitted') === 0) { return { dot: 'info', icon: 'arrowR' }; }
    if (t.indexOf('renewal requested') === 0) { return { dot: 'info', icon: 'doc' }; }
    return { dot: 'info', icon: 'dot' };
  }

  /* ---------------- request status (applicant view) ---------------- */
  XRSLP.screens.requestStatus = function (params) {
    var r = state.request(params.id);
    if (!r) { return XRSLP.screens.notFound(); }

    var termLabel = (data.term(r.term) || {}).label || r.term;
    var headActions = '';

    var statusBlock = '';
    if (r.status === state.STATUS.SUBMITTED) {
      statusBlock =
        ui.alertBox('info', 'Submitted — awaiting platform review',
          '<p>The platform team reviews institutional access requests. The state changes here once a ' +
          'decision is made. No access is granted before approval.</p>') +
        /* The stakeholder hand-off, as a demo affordance rather than as
           a caveat: it is how the walkthrough drives itself, and it is
           not a statement about the product. */
        ui.demoPanel('Continue this walkthrough as the reviewer',
          '<p>Switch to <strong>Super Admin</strong> in the Prototype controls strip to decide this request.</p>');
    } else if (r.status === state.STATUS.INFO_REQUESTED) {
      /* STK31-20's second outcome, from the applicant's side: a state
         they can see, with the reason, and a way back into the queue. */
      statusBlock =
        ui.alertBox('warning', 'More information requested',
          '<p>The platform has asked for more information before deciding this request. It is ' +
          '<strong>not</strong> approved and <strong>not</strong> refused, and nothing has been activated.</p>' +
          (r.decisionReason
            ? '<p><strong>What was asked for:</strong> ' + esc(r.decisionReason) + '</p>'
            : '') +
          '<p>Reply below to return the request to the platform review queue. ' +
          'Your selected content, quantity and term are unchanged.</p>') +
        '<form class="card" id="resub-form" novalidate><div class="cbody">' +
        '<div class="form-errors"></div>' +
        '<div class="field" id="resub-note"><label for="rsn">Your reply ' +
        '<span class="req" aria-hidden="true">*</span><span class="sr-only">(required)</span></label>' +
        '<textarea id="rsn" rows="3" placeholder="The information the platform asked for."></textarea>' +
        '<div class="fhint">Recorded on this request&rsquo;s history, which the platform reviewer reads.</div></div>' +
        '<div class="formact"><button class="btn pri" type="button" id="resub-go">Resubmit request</button>' +
        '<span class="formnote">Nothing is sent anywhere — this page is where the request lives.</span></div>' +
        '</div></form>';
    } else if (r.status === state.STATUS.APPROVED_PAYMENT_REQUIRED) {
      /* THE FORWARD ACTION IS A PAGE-LEVEL PRIMARY. It used to be a
         small button inside a paragraph inside a warning box, below two
         paragraphs and a list of unaffected records — no standing at
         all, on the single most important step of the external journey.
         The alert explains; the header acts. */
      headActions = '<a class="btn pri" href="' + payHref(r.id) + '">' + ui.ic('card') + 'Continue to payment</a>';
      statusBlock =
        ui.alertBox('warning', 'Approved — payment required',
          '<p>The platform has approved this request. Payment is required before the access under ' +
          '<strong>this request</strong> is activated. <strong>Continue to payment</strong> is at the top ' +
          'of this page.</p>' +
          unaffectedHTML(r) +
          (r.decisionReason ? '<p><strong>Reviewer&rsquo;s note:</strong> ' +
            esc(r.decisionReason) + '</p>' : '') +
          '<p>The payment step is <strong>simulated</strong> in this prototype: no amount is configured ' +
          'and no provider is represented.</p>') +
        approvedCard(r);
    } else if (r.status === state.STATUS.ACTIVE) {
      var tenant = r.tenantId ? state.tenantById(r.tenantId) : null;
      /* WHAT WAS ACTUALLY GRANTED, on the applicant's own screen.
         The Super Admin may approve LESS than was asked for, and the
         external route showed that on the payment step — but the
         INTERNAL route has no payment step, so an institution could be
         given fewer experiments, technologies or licences than it
         requested and read nothing but "Access active" beside its
         original request. */
      statusBlock =
        ui.alertBox('success', 'Access active',
          '<p>Institutional access under this request is active' +
          (tenant ? ' for <strong>' + esc(tenant.name) + '</strong>' : '') +
          '. The institution&rsquo;s admin workspace now shows the approved content, technologies, licence quantity and access term.</p>' +
          /* Named here too, because activation is the moment a second
             record appears beside the first and the institution has to
             be able to see that the first is still exactly as it was. */
          unaffectedHTML(r) +
          (r.decisionReason
            ? '<p><strong>Reviewer&rsquo;s note:</strong> ' + esc(r.decisionReason) + '</p>'
            : '')) +
        approvedCard(r) +
        ui.demoPanel('Continue this walkthrough as the institution',
          '<p>Switch to <strong>Tenant Admin</strong> in the Prototype controls strip to see the activated ' +
          'content from the institution&rsquo;s side.</p>');
    }

    var itemList = r.items.map(function (item) { return itemRowHTML(item); }).join('');

    /* THE NOTE IS RENDERED, not merely stored. STK31-20 requires a
       REASON and a HISTORY TRAIL, and a reason nobody can read is
       neither. This is also the ONLY place the applicant's reply to a
       request for more information reaches the reviewer — it lives on
       the history entry and nowhere else — so omitting it made the
       round trip one-way. */
    var timeline = '<div class="timeline">' + r.history.map(function (h) {
      var mark = historyMark(h);
      return '<div class="tl-item"><span class="tl-dot ' + mark.dot + '">' + ui.ic(mark.icon) + '</span>' +
        '<div class="tl-body"><div class="tl-action">' + esc(h.event) + '</div>' +
        '<div class="tl-who">' + esc(h.who) + ' · ' + esc(util.fmtDateTime(h.at)) + '</div>' +
        (h.note ? '<p class="tl-note">' + esc(h.note) + '</p>' : '') +
        '</div></div>';
    }).join('') + '</div>';

    var html =
      ui.crumbs([{ label: 'Requests', href: '#/requests' }, { label: r.id }]) +
      ui.phead('Request ' + r.id, esc(r.institution.name) + ' · submitted ' + esc(util.fmtDate(r.submittedAt)),
        headActions, ui.statusBadge(r.status)) +
      '<div class="grid-rail">' +
      '<div class="stack">' +
      statusBlock +
      ui.card('Requested content', '<div class="reqitems">' + itemList + '</div>',
        r.items.length + ' ' + util.plural(r.items.length, 'experiment')) +
      ui.card('Request details',
        '<div class="kv">' +
        '<div class="k">Institution</div><div class="v">' + esc(r.institution.name) + '</div>' +
        '<div class="k">Access context</div><div class="v">' + esc(r.institution.accessContext) + '</div>' +
        '<div class="k">Contact (SPOC)</div><div class="v">' + esc(r.institution.contactName) + ' · ' + esc(r.institution.contactEmail) + '</div>' +
        '<div class="k">Licences</div><div class="v">' + r.quantity + '</div>' +
        '<div class="k">Access term</div><div class="v">' + esc(termLabel) + '</div>' +
        '<div class="k">Payment</div><div class="v">' + (r.paymentRequired ? 'Required after approval' : 'Not required for this access context') + '</div>' +
        '</div>') +
      /* THE PUBLIC PLANE HAS NO SIGNED-IN SUPPORT SURFACE, and saying
         nothing was the current answer by omission. This is the honest
         one: the request itself is the channel, and no message of any
         kind is sent. Folded, because it is help rather than news. */
      ui.about('Something wrong with this request?',
        '<p>The request itself is the channel. A reviewer&rsquo;s decision, the reason for it, and any reply ' +
        'you make are all recorded on this page, and this page is where the outcome appears.</p>' +
        '<p>There is no public sign-in in this prototype, so there is no signed-in support surface for a ' +
        'requester and no message of any kind is sent — no email, no SMS, no notification.</p>') +
      '</div>' +
      '<div class="stack">' + ui.card('History', timeline,
        r.history.length + ' ' + util.plural(r.history.length, 'entry', 'entries')) +
      /* The list screen explains why one browser sees another
         institution's requests. This deep link is not scoped at all,
         which makes the omission easy to miss — so it is said here too. */
      ui.protoNote('This prototype has no authentication, so a request page opens for anyone who has its ' +
        'address. In production a requester sees only their own institution&rsquo;s requests, after signing in.') +
      '</div>' +
      '</div>';

    return {
      title: 'Request ' + r.id,
      html: html,
      navKey: 'requests',
      after: function () {
        var form = document.getElementById('resub-form');
        if (!form) { return; }
        document.getElementById('resub-go').addEventListener('click', function () {
          var note = String(form.querySelector('#rsn').value || '').trim();
          if (!ui.showErrors(form, note ? [] : [{ field: 'resub-note', message: 'Enter your reply before resubmitting.' }],
              'This request cannot be resubmitted yet')) { return; }
          var updated = state.resubmitRequest(r.id, note);
          if (updated) { ui.toast('Request ' + updated.id + ' resubmitted for platform review.'); }
          XRSLP.render(false);
        });
      }
    };
  };

  /* ---------------- external payment step (prototype simulation) ---------------- */
  XRSLP.screens.payment = function (params) {
    var r = state.request(params.id);
    if (!r) { return XRSLP.screens.notFound(); }
    /* Only an external request awaiting payment renders this screen.
       Everything else — including the entire internal route — goes to
       the request status page instead (STK31-19). */
    if (r.status !== state.STATUS.APPROVED_PAYMENT_REQUIRED) {
      return { redirect: statusHref(r.id) };
    }

    /* What the SUPER ADMIN granted, which is not always what was asked
       for (STK31-24). The payment step must show the institution the
       allocation it is actually paying to activate. */
    var granted = r.grant || { items: r.items, quantity: r.quantity, term: r.term };
    var narrowed = state.grantNarrowsRequest(r);
    var termLabel = (data.term(granted.term) || {}).label || granted.term;

    /* The last attempt's outcome, if there was one. Only SUCCESS writes,
       so a declined or unconfirmed attempt leaves the request exactly
       where it was and the screen has to say so honestly. */
    var lastOutcome = r.paymentOutcome || null;
    var outcomeBlock = lastOutcome === state.PAYMENT_OUTCOME.DECLINED
      ? ui.alertBox('danger', 'The last payment attempt was declined',
          '<p>Nothing was activated and nothing about this request changed. The approved allocation, ' +
          'the quantity and the term are all exactly as they were, and no student is entitled. ' +
          'You can attempt payment again below.</p>')
      : lastOutcome === state.PAYMENT_OUTCOME.INDETERMINATE
      ? ui.alertBox('warning', 'The last payment outcome was not confirmed',
          '<p>The platform does not know whether that attempt succeeded. Nothing was activated, and ' +
          'nothing about this request changed. In the product this state is resolved against the payment ' +
          'provider before anything is activated; in this prototype it simply persists until an attempt ' +
          'succeeds.</p>')
      : '';

    var html =
      ui.crumbs([{ label: 'Requests', href: '#/requests' },
                 { label: r.id, href: statusHref(r.id) },
                 { label: 'Payment' }]) +
      ui.phead('Payment required', esc(r.institution.name) + ' · request ' + esc(r.id), null,
        ui.statusBadge(r.status)) +
      /* The page runs to the same width as every other public screen. It
         used to narrow to 660px, which made the last step of the
         external journey look like a different product. */
      '<div class="stack">' +
      ui.alertBox('warning', 'Approved — awaiting payment',
        '<p>The platform has approved this institutional request. Payment is required before the access ' +
        'under <strong>this request</strong> is activated.</p>' +
        unaffectedHTML(r)) +
      outcomeBlock +
      ui.card('What will be activated',
        (narrowed
          ? '<p class="chelp">The platform approved <strong>less</strong> than was requested. These are the ' +
            'approved figures; the original request, and the reviewer&rsquo;s reason, are on the ' +
            '<a href="' + statusHref(r.id) + '">request status page</a>.</p>'
          : '') +
        '<div class="kv">' +
        '<div class="k">Institution</div><div class="v">' + esc(r.institution.name) + '</div>' +
        '<div class="k">Experiments</div><div class="v">' + granted.items.length +
          (narrowed && granted.items.length !== r.items.length
            ? ' <span class="muted">(' + r.items.length + ' requested)</span>' : '') + '</div>' +
        '<div class="k">Licences</div><div class="v">' + granted.quantity +
          (narrowed && granted.quantity !== r.quantity
            ? ' <span class="muted">(' + r.quantity + ' requested)</span>' : '') + '</div>' +
        '<div class="k">Access term</div><div class="v">' + esc(termLabel) + '</div>' +
        '<div class="k">Access context</div><div class="v">' + esc(r.institution.accessContext) + '</div>' +
        '</div>' +
        '<p class="cardfoot">In the product, this step carries the commercial arrangement agreed for the ' +
        'institutional request.</p>') +
      /* ND-12 / U-COM-03 — the step is PROVIDER-NEUTRAL and carries all
         three FRD 9.1.x outcomes, and ONLY SUCCESS WRITES. The three
         controls do not simulate a gateway; they choose which of the
         three states the institution is left in, which is a real
         product question with or without a provider.

         They are the only controls on this page, so they get a real
         action bar with a clear primary rather than living inside a
         dashed caveat box. The page disclaims itself ONCE — the old
         `.paybox` and the prototype note said overlapping things about
         the same absence, one directly above the other. */
      '<div class="payact">' +
      '<button class="btn pri lg" type="button" id="pay-simulate">' + ui.ic('card') + 'Payment successful</button>' +
      '<p class="pa-n"><strong>Simulated.</strong> No amount is configured and no provider is represented — ' +
      'no payment is taken. Choose which of the three outcomes to represent; only a successful payment ' +
      'activates anything, and the other two leave this request exactly as it is.</p>' +
      '<span class="pa-k">Other outcomes</span>' +
      '<div class="pa-alt">' +
      '<button class="btn sec" type="button" id="pay-declined">Payment declined</button> ' +
      '<button class="btn sec" type="button" id="pay-unknown">Outcome not confirmed</button>' +
      '</div>' +
      '</div>' +
      '</div>';

    return {
      title: 'Payment — ' + r.id,
      html: html,
      navKey: 'requests',
      after: function () {
        function wire(id, outcome, done) {
          var btn = document.getElementById(id);
          if (!btn) { return; }
          btn.addEventListener('click', function () {
            btn.setAttribute('disabled', 'disabled');
            var updated = state.completePayment(r.id, outcome);
            if (updated) { done(updated); }
          });
        }
        wire('pay-simulate', state.PAYMENT_OUTCOME.SUCCESS, function (updated) {
          /* 07.3 — a RENEWAL activates nothing new. It extends the term
             of an access record the institution already holds, so saying
             "access is now active" would describe the wrong event and
             imply a second grant. The screen body already says which
             record was renewed; the toast now agrees with it. */
          ui.toast(updated.renewsAccessId
            ? 'Payment simulated — the renewal of ' + updated.renewsAccessId + ' is now activated ' +
              'and its term extended. No new access was created.'
            : 'Payment simulated — access for ' + updated.institution.name + ' is now active.');
          XRSLP.router.go(statusHref(r.id));
        });
        wire('pay-declined', state.PAYMENT_OUTCOME.DECLINED, function () {
          ui.toast('Payment declined — nothing was activated.');
          XRSLP.render(false);
        });
        wire('pay-unknown', state.PAYMENT_OUTCOME.INDETERMINATE, function () {
          ui.toast('Payment outcome not confirmed — nothing was activated.');
          XRSLP.render(false);
        });
      }
    };
  };
})();
