/* Super Admin · SA-01 Overview, SA-02 Requests, SA-03 Request decision
   Selected V3 seeds: markup and behaviour follow SA01.dc.html / SA02.dc.html; data now comes from the shared role state. */
(function () {
  const SA = window.SA, D = SA.D, esc = SA.esc, V = SA.V, A = SA.A;

  /* ═══ SA-01 Overview ═══════════════════════════════════════════════════════ */
  const G = {
    req: { name: 'Requests', link: 'Open Requests', href: '#/requests', icon: '#rbi-inbox', quiet: 'No request is waiting for your decision.' },
    upd: { name: 'Corrections waiting for your release decision', link: 'Open Updates', href: '#/content/updates', icon: '#rbi-edit', quiet: 'No correction is waiting for your release decision.' },
    dtr: { name: 'Device transfers', link: 'Open Device transfers', href: '#/operations/device-transfers', icon: '#rbi-vr', quiet: 'No device transfer has been forwarded to BITS.' },
    sup: { name: 'Support reports', link: 'Open Support', href: '#/operations/support', icon: '#rbi-life', quiet: 'No support report is open.' },
    end: { name: 'Access ending within 15 days', link: 'Open Access ending', href: '#/operations/access-ending', icon: '#rbi-cal', quiet: 'No institution’s access ends in the next 15 days.' },
    noia: { name: 'Institutions without an Institute Admin', link: 'Open Institutions', href: '#/institutions', icon: '#rbi-userminus', quiet: 'Every institution with access has an Institute Admin.' },
    stuck: { name: 'Stuck content', link: 'Open All content', href: '#/content/all', icon: '#rbi-hourglass', quiet: 'Nothing is stuck in the content workflow.' },
    scope: { name: 'Role holders without scope', link: 'Open Platform roles', href: '#/roles/reviewers', icon: '#rbi-userq', quiet: 'Every role holder has a scope.' }
  };
  const CATS = [['all', 'All'], ['req', 'Requests', ['req']], ['upd', 'Corrections', ['upd']], ['dtr', 'Device transfers', ['dtr']], ['sup', 'Support', ['sup']], ['end', 'Access ending', ['end']], ['setup', 'Set-up gaps', ['noia', 'stuck', 'scope']]];

  function groupHtml(k, rows) {
    const g = G[k];
    return '<section class="rb-g" aria-label="' + esc(g.name) + '"><div class="rb-g-head"><span class="rb-ico-tile" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="' + g.icon + '"></use></svg></span><h3 class="rb-g-name">' + esc(g.name) + '</h3><a class="rb-link" href="' + g.href + '">' + esc(g.link) + '</a></div>' +
      (rows.length ? '<ul class="rb-rows">' + rows.map(r => '<li class="rb-row"><div class="rb-row-main"><p class="rb-row-t">' + esc(r.t) + '</p><p class="rb-row-d">' + esc(r.d) + '</p></div><p class="rb-row-when' + (r.due ? ' rb-row-when--due' : '') + '"><b>' + esc(r.when) + '</b><span>' + esc(r.when2) + '</span></p><div class="rb-row-act"><a class="rb-btn rb-btn--ghost" href="' + r.href + '" aria-label="' + esc(r.aria) + '">' + esc(r.act) + '</a></div></li>').join('') + '</ul>'
        : '<p class="sa-quietrow">' + SA.ico('rki-check', '') + '<span>' + esc(g.quiet) + '</span></p>') + '</section>';
  }

  V.overview = () => {
    const S = SA.S, W = SA.work(), mode = SA.listMode();
    const act = S.insts.filter(i => ['active', 'ending'].indexOf(SA.instStatus(i)) >= 0).length;
    const paused = S.insts.filter(i => SA.instStatus(i) === 'paused').length, pay = S.insts.filter(i => SA.instStatus(i) === 'payment').length;
    const pub = S.content.filter(c => c.st === 'published').length;
    const extra = [paused ? paused + ' paused' : '', pay ? pay + ' awaiting payment' : ''].filter(Boolean).join(', ');
    const size = c => (c[2] || Object.keys(G)).reduce((n, k) => n + W[k].length, 0);
    const sel = CATS.find(c => c[0] === S.ui.ov) || CATS[0], isAll = sel[0] === 'all', total = size(CATS[0]);
    let h = '<header class="rb-head"><div><p class="rb-eyebrow-date">' + esc(S.A.long) + '</p><h1 class="rb-h1" id="page-h1" tabindex="-1">Overview</h1></div>' +
      '<dl class="rb-figs" aria-label="Platform at a glance"><div class="rb-fig"><dt class="rb-fig-t">Active institutions</dt><dd class="rb-fig-n">' + act + '</dd><dd class="rb-fig-s"><span>Access active or ending soon.</span>' + (extra ? ' <span>' + esc(extra) + '.</span>' : '') + '</dd></div>' +
      '<div class="rb-fig"><dt class="rb-fig-t">Published experiments</dt><dd class="rb-fig-n">' + pub + '</dd><dd class="rb-fig-s">Live in the catalogue today</dd></div></dl></header>';
    if (mode === 'loading') return h + '<section class="rb-queue" aria-busy="true"><p class="rk-loading-msg" role="status" style="padding-left:0">Loading what is waiting…</p>' + [0, 1, 2].map(() => '<div class="rk-skel-row" aria-hidden="true" style="padding-left:0;padding-right:0"><div><span class="rk-skel"></span><span class="rk-skel"></span></div><div><span class="rk-skel"></span></div><div></div><div></div><div><span class="rk-skel"></span></div></div>').join('') + '</section>';
    if (mode === 'failed') return h + '<section class="rb-queue">' + SA.listState('failed', { failed: 'We couldn’t load what is waiting' }) + '</section>';
    h += '<div class="rb-switchbar"><div class="rb-switch" role="group" aria-label="Show what is waiting">' + CATS.map(c => '<button type="button" id="ov-' + c[0] + '" aria-pressed="' + (c[0] === sel[0] ? 'true' : 'false') + '" data-act="ovPick" data-k="' + c[0] + '">' + c[1] + '<b>' + size(c) + '</b></button>').join('') + '</div></div>';
    if (isAll && total === 0) {
      return h + '<section class="rb-queue" aria-labelledby="ov-calm-t"><div class="rb-calm"><span class="rb-calm-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span><p class="rb-calm-t" id="ov-calm-t">Nothing is waiting</p><p class="rb-calm-d">Requests, corrections to release, device transfers, support reports, ending access, institutions without an Institute Admin, stuck content and role holders without scope appear here when they need you.</p></div></section>';
    }
    let groups;
    if (isAll) {
      const prio = W.end.concat(W.upd.map(u => Object.assign({}, u, { prioUpd: true }))).slice(0, 3);
      const inBand = prio.length;
      if (inBand) {
        h += '<section class="rb-prio" aria-labelledby="rb-prio-h"><div class="rb-sec-head"><h2 class="rb-h2" id="rb-prio-h">Needs attention first</h2><p class="rb-note">Soonest deadline first, then the longest wait</p></div><ol class="rb-prio-list">' +
          prio.map((p, i) => p.prioUpd
            ? '<li class="rb-pi"><p class="rb-pi-when"><span class="rb-pi-big">' + esc(p.when) + '</span><span class="rb-pi-rel rb-pi-rel--calm">Waiting since ' + esc(p.when2.replace('since ', '')) + '</span></p><p class="rb-pi-kind"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#rbi-edit"></use></svg>Correction waiting for release</p><h3 class="rb-pi-title">' + esc(p.u.name) + ' correction</h3><p class="rb-pi-d">Version ' + esc(p.u.to) + ' was approved by the Academic Reviewer on ' + esc(SA.dLong(p.u.apprIso)) + '. Version ' + esc(p.u.from) + ' is still live.</p><div class="rb-pi-act"><a class="rb-btn' + (i === 0 ? ' rb-btn--primary' : '') + ' rb-btn--lg" href="' + p.href + '" aria-label="' + esc(p.aria) + '">Review correction</a></div></li>'
            : '<li class="rb-pi"><p class="rb-pi-when"><span class="rb-pi-big">' + esc(p.when2) + '</span><span class="rb-pi-rel">' + esc(p.when) + '</span></p><p class="rb-pi-kind"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#rbi-cal"></use></svg>Access ending</p><h3 class="rb-pi-title">' + esc(p.t) + '</h3><p class="rb-pi-d">' + esc(p.pd) + '</p><div class="rb-pi-act"><a class="rb-btn' + (i === 0 ? ' rb-btn--primary' : '') + ' rb-btn--lg" href="' + p.href + '" aria-label="' + esc(p.aria) + '">' + esc(p.act) + '</a></div></li>').join('') + '</ol></section>' +
          '<div class="rb-sec-head" style="margin-bottom: -12px"><h2 class="rb-h2">Also waiting on you</h2><p class="rb-note">Oldest first in each group</p></div>';
      }
      const shownEnd = prio.filter(p => !p.prioUpd).length, shownUpd = prio.filter(p => p.prioUpd).length;
      const rest = { end: W.end.slice(shownEnd), upd: W.upd.slice(shownUpd) };
      groups = ['req', 'upd', 'dtr', 'sup', 'end', 'noia', 'stuck', 'scope'].map(k => [k, rest[k] || W[k]]).filter(g => g[1].length);
    } else {
      h += '<h2 class="xr-sr">' + esc(sel[1] + ', ' + SA.plural(size(sel), 'item')) + '</h2>';
      groups = sel[2].map(k => [k, W[k]]);
    }
    return h + '<div class="rb-queue" aria-live="polite">' + groups.map(g => groupHtml(g[0], g[1])).join('') + '</div>';
  };
  A.ovPick = d => { SA.S.ui.ov = d.k; SA.render(); SA.focus('ov-' + d.k); };

  /* ═══ SA-02 Requests ═══════════════════════════════════════════════════════ */
  V.requests = () => {
    const S = SA.S, L = S.ui.reqList, mode = SA.listMode();
    const q = SA.T(L.q).toLowerCase();
    const all = S.requests;
    let list = all.filter(r => {
      const rs = SA.reqStatus(r), rr = SA.reqRoute(r) || 'Not set yet';
      return (!q || (r.inst + ' ' + r.contact).toLowerCase().indexOf(q) >= 0) && (L.st === 'all' || rs === L.st) && (L.type === 'all' || r.type === L.type) && (L.route === 'all' || rr === L.route);
    }).sort((a, b) => L.desc ? b.iso.localeCompare(a.iso) : a.iso.localeCompare(b.iso));
    const chips = [];
    if (q) chips.push(['q', 'Search: “' + SA.T(L.q) + '”']);
    if (L.st !== 'all') chips.push(['st', 'Status: ' + SA.REQ_LBL[L.st]]);
    if (L.type !== 'all') chips.push(['type', 'Type: ' + L.type]);
    if (L.route !== 'all') chips.push(['route', 'Internal or external: ' + L.route]);
    const sortLabel = L.desc ? 'received, newest first' : 'received, oldest first', sortShort = L.desc ? 'newest first' : 'oldest first';
    const arrow = SA.ico(L.desc ? 'rki-down' : 'rki-up', '');
    const sel = (id, bind, val, opts) => '<div class="rk-selwrap"><select id="' + id + '" class="rk-select" data-bind="' + bind + '">' + opts.map(o => '<option value="' + esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>' + SA.ico('rki-chev', '') + '</div>';
    const typeOpts = [['all', 'All types'], ['New access', 'New access'], ['Additional licences', 'Additional licences'], ['Renewal', 'Renewal']];
    let h = '<div class="rk-head"><div class="rk-head-text"><p class="rb-eyebrow-date">' + esc(S.A.long) + '</p><h1 class="rb-h1" id="page-h1" tabindex="-1">Requests</h1><p class="rk-sub">Institutional access requests sent from the public site. Open one to decide it.</p></div></div>';
    h += '<section class="rk-surface" aria-label="Institutional access requests">';
    if (mode !== 'empty') {
      h += '<div class="rk-toolbar"><div class="rk-tools" role="search" aria-label="Filter requests">' +
        '<div class="rk-field rk-search"><label class="rk-label" for="rq-q">Search</label><div class="rk-inputwrap">' + SA.ico('rki-search', '') + '<input id="rq-q" class="rk-input" type="search" placeholder="Institution or contact person" autocomplete="off" value="' + esc(L.q) + '" data-bind="ui.reqList.q" data-live="1"></div></div>' +
        '<div class="rk-field rk-field--st"><label class="rk-label" for="rq-st">Status</label>' + sel('rq-st', 'ui.reqList.st', L.st, [['all', 'All statuses']].concat(Object.keys(SA.REQ_LBL).map(k => [k, SA.REQ_LBL[k]]))) + '</div>' +
        '<div class="rk-field rk-field--type"><label class="rk-label" for="rq-type">Type</label>' + sel('rq-type', 'ui.reqList.type', L.type, typeOpts) + '</div>' +
        '<div class="rk-btnfield"><button type="button" class="rb-btn rk-toggle" id="rq-moretog" aria-expanded="' + (L.more ? 'true' : 'false') + '" aria-controls="rq-more" data-act="reqMore">' + SA.ico('rki-filter', 'xr-ico xr-ico--18') + 'More filters' + (L.route !== 'all' ? '<b aria-hidden="true">1</b><span class="xr-sr">, 1 applied</span>' : '') + '</button></div></div>';
      if (L.more) h += '<div class="rk-more" id="rq-more"><div class="rk-field rk-more-type"><label class="rk-label" for="rq-type2">Type</label>' + sel('rq-type2', 'ui.reqList.type', L.type, typeOpts) + '</div><div class="rk-field"><label class="rk-label" for="rq-route">Internal or external</label>' + sel('rq-route', 'ui.reqList.route', L.route, [['all', 'All'], ['Internal', 'Internal'], ['External', 'External'], ['Not set yet', 'Not set yet']]) + '</div></div>';
      if (mode === 'ok' || chips.length) {
        h += '<div class="rk-statusline">' + (mode === 'ok' ? '<p class="rk-count" role="status">' + (chips.length ? list.length + ' of ' + all.length + ' requests' : all.length + ' requests') + '</p><div class="rk-sortbar"><button type="button" class="rk-sortbtn" id="rq-sort2" data-act="reqSort"><span class="rk-sort-l">Sort: ' + sortLabel + '</span><span class="rk-sort-s">Sort: ' + sortShort + '</span>' + arrow + '</button></div>' : '') +
          (mode === 'ok' && chips.length ? '<span class="rk-break" aria-hidden="true"></span>' : '') +
          chips.map(c => '<span class="rk-chip">' + esc(c[1]) + '<button type="button" aria-label="Remove filter ' + esc(c[1]) + '" data-act="reqChip" data-k="' + c[0] + '">' + SA.ico('rki-x', '') + '</button></span>').join('') +
          (chips.length ? '<button type="button" class="rk-clear" data-act="reqClear">Clear filters</button>' : '') + '</div>';
      }
      h += '</div>';
    }
    if (mode !== 'ok') h += SA.listState(mode, { loading: 'Loading requests…', failed: 'We couldn’t load the requests', emptyT: 'No requests yet', emptyD: 'Requests that institutions send from the public site appear here.' });
    else if (!list.length) h += SA.listState('none', { noneT: 'No requests match these filters', noneD: 'Try fewer filters or a different spelling of the institution or contact person.', clearAct: 'reqClear' });
    else {
      h += '<div class="rk-tablewrap"><table class="rk-table"><caption>Institutional access requests, ' + sortLabel + '</caption><thead><tr><th scope="col" class="rk-c-inst">Institution and contact person</th><th scope="col" class="rk-c-exp">Experiments</th><th scope="col" class="rk-c-type">Type</th><th scope="col" class="rk-c-date" aria-sort="' + (L.desc ? 'descending' : 'ascending') + '"><button type="button" class="rk-sortbtn" id="rq-sort" data-act="reqSort">Received' + arrow + '<span class="xr-sr">, ' + sortLabel + '. Change order</span></button></th><th scope="col" class="rk-c-st">Status</th></tr></thead><tbody>' +
        list.map(r => {
          const rs = SA.reqStatus(r), one = r.exps && r.exps.length === 1 ? r.exps[0] : null, n = r.exps ? r.exps.length : r.expCount;
          return '<tr data-href="#/requests/' + r.key + '"><td class="rk-c-inst"><a class="rk-rowlink" href="#/requests/' + r.key + '" aria-label="' + esc(r.inst + ', ' + r.type.toLowerCase() + ', received ' + r.received.split(',')[0] + ', ' + SA.REQ_LBL[rs] + '. Open the request') + '">' + esc(r.inst) + '</a><span class="rk-small">' + esc(r.contact) + '</span></td>' +
            '<td class="rk-c-exp"><span class="rk-strong">' + esc(one ? one.t : n + ' experiments') + '</span>' + (one ? SA.fmtBadges(one.req, 'Formats requested: ' + one.req.join(', ')) : '') + '</td>' +
            '<td class="rk-c-type"><span class="rk-strong">' + esc(r.type) + '</span><span class="rk-small">' + esc(SA.reqRoute(r) || 'Not set yet') + '</span></td>' +
            '<td class="rk-c-date"><span class="rk-inlabel">Received </span>' + esc(r.received.split(',')[0]) + '</td><td class="rk-c-st">' + SA.pill(SA.REQ_KIND[rs], SA.REQ_LBL[rs]) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    return h + '</section>';
  };
  A.reqMore = () => { const L = SA.S.ui.reqList; L.more = !L.more; SA.render(); SA.focus('rq-moretog'); };
  A.reqSort = (d, el) => { const L = SA.S.ui.reqList; L.desc = !L.desc; SA.render(); SA.focus(el.id); };
  A.reqChip = d => { const L = SA.S.ui.reqList; if (d.k === 'q') L.q = ''; else L[d.k] = 'all'; SA.render(); SA.focus('rq-q'); };
  A.reqClear = () => { Object.assign(SA.S.ui.reqList, { q: '', st: 'all', type: 'all', route: 'all' }); SA.render(); SA.focus('rq-q'); };

  /* ═══ SA-03 Request decision ═══════════════════════════════════════════════ */
  const ERR_TARGET = { choice: 'dc-c0', route: 'dc-r0', lic: 'dc-lic', diff: 'dc-lic', reason: 'dc-reason' };
  function model(r) {
    const S = SA.S, f = r.form, d = r.dec.decided, route = r.route || f.route;
    const exp0 = r.exps ? r.exps[0] : null, reqL = exp0 ? exp0.req : [];
    const fm = f.fm || reqL.reduce((o, x) => Object.assign(o, { [x]: true }), {});
    const licIn = f.lic === null ? (r.licNum || '') : f.lic, term = f.term || r.term || '';
    const approving = f.choice === 'approve' || f.choice === 'smaller';
    const diffs = [];
    if (f.choice === 'smaller') {
      const kept = reqL.filter(x => fm[x]);
      if (kept.length !== reqL.length) diffs.push('Formats: ' + reqL.join(', ') + ' → ' + (kept.join(', ') || 'none'));
      if (String(licIn) !== String(r.licNum)) diffs.push('Licences: ' + r.lic + ' → ' + licIn + (r.more ? ' more' : ''));
      if (!r.termFixed && term !== r.term) diffs.push('Term: ' + r.term + ' → ' + term);
    }
    const validate = () => {
      const e = {};
      if (!f.choice) e.choice = 'Choose a decision';
      if (approving && !route) e.route = 'Choose internal or external';
      if (f.choice === 'smaller') {
        if (!reqL.some(x => fm[x])) e.fm = 'Keep at least one format';
        if (!/^[1-9][0-9]*$/.test(String(licIn))) e.lic = 'Enter a whole number of licences';
        if (!diffs.length) e.diff = 'Change at least one thing, or choose Approve request';
      }
      if ((f.choice === 'smaller' || f.choice === 'info') && !SA.T(f.reason)) e.reason = f.choice === 'info' ? 'Enter what you need from the requester' : 'Enter the reason for the change';
      return e;
    };
    return { f, d, route, reqL, fm, licIn, term, approving, diffs, validate, isNew: !r.hasPlan };
  }
  const rl = x => x === 'Internal' ? 'internal' : 'external';

  V.decision = r => {
    const S = SA.S, M = model(r), f = M.f, d = M.d, route = M.route, cur = SA.reqStatus(r), blocked = SA.reqBlocked(r);
    const n = r.exps ? r.exps.length : r.expCount;
    const committed = r.route || ((d === 'pay' || d === 'active' || d === 'pend') ? r.dec.route : null);
    const facts = [['Experiments', String(n)]].concat(r.lic ? [['Licences requested', r.lic]] : [], r.term ? [['Access term', r.term]] : [], [['Internal or external', committed || 'Not set yet', !committed]]);
    const inst = r.instId && SA.inst(r.instId);
    let existing = r.existing || '';
    const s = r.dec;
    if (M.isNew && d === 'pay') existing = s.when ? 'Institution record created by this approval on ' + s.when + '. No institutional access yet; it is activated only after the payment is confirmed.' : 'Institution record created at approval. No institutional access yet; it is activated only after the payment is confirmed.';
    if (M.isNew && d === 'active') existing = (s.route || route) === 'External' ? 'Institution record created on ' + s.when + '. Institutional access active since ' + s.paid + ', after the payment was confirmed.' : 'Institution record created on ' + s.when + '. Institutional access active since then (internal, no payment step).';
    if (M.isNew && (!d || d === 'info') && !r.existing) existing = 'None. There is no institution record for ' + r.inst + ' yet.';
    if (r.key === 'konark-licences' && inst && SA.instStatus(inst) === 'paused') existing = 'An access plan with Buck Converter Ripple (WEB, AR) and 180 licences. The institution is paused.';
    const hist = [];
    const rt = s.route || route;
    if (d === 'active' && rt === 'External' && s.paid) hist.push(['Institutional access activated', s.paid, 'Access plan created for the institution.'], ['Payment confirmed', s.paid, '']);
    if (d === 'active' && rt === 'Internal' && s.when && !s.fromBase && M.isNew) hist.push(['Institutional access activated', s.when, 'No payment step (internal). Access plan created.']);
    if ((d === 'pay' || d === 'active') && s.when) hist.push([(s.choice === 'smaller' ? 'Request approved with a smaller scope' : 'Request approved') + ' (' + rl(rt) + ')', s.when + ' by Arjun Mehta',
      (M.isNew ? 'Institution record created. ' : '') + (rt === 'External' ? (M.isNew ? 'Status: Approved — payment required. Access not active until the payment is confirmed.' : 'Status: Approved — payment required. Current access continues unchanged.') : 'No payment step.') + (s.choice === 'smaller' && s.reason ? ' Reason: “' + s.reason + '”' : '')]);
    if (d === 'info' && s.when) hist.push(['Information requested', s.when + ' by Arjun Mehta', s.reason ? '“' + s.reason + '”' : '']);
    hist.push(['Request submitted', r.received + ' by ' + r.contact + ', contact person', '']);

    let h = SA.crumbs([['Requests', '#/requests'], [r.inst]]) +
      '<div class="rk-head"><div class="rk-head-text"><p class="rb-eyebrow-date">' + esc(S.A.long) + '</p><p class="rk-eyebrow">Institutional access request</p><h1 class="rk-title" id="page-h1" tabindex="-1">' + esc(r.inst) + '</h1><div class="rk-meta">' + SA.pill(SA.REQ_KIND[cur], SA.REQ_LBL[cur], true) + '<span>' + esc(r.type) + '</span><span class="rk-meta-sep" aria-hidden="true"></span><span>Received ' + esc(r.received) + '</span></div></div><a class="rb-btn rk-goto" href="#dc-panel" data-act="goPanel">Go to decision</a></div>';
    h += '<div class="rk-detailwrap"><div class="rk-detail"><div class="rk-surface rk-mainsheet"><dl class="rk-factstrip">' + facts.map(x => '<div class="rk-fact"><dt>' + esc(x[0]) + '</dt><dd' + (x[2] ? ' class="is-quiet"' : '') + '>' + esc(x[1]) + '</dd></div>').join('') + '</dl>' +
      '<section class="rk-sec" aria-labelledby="dc-org"><div class="rk-sec-h"><h2 class="rb-h2" id="dc-org">Organisation and contact person</h2></div><dl class="rk-dl"><dt>Institution</dt><dd>' + (inst ? '<a href="#/institutions/' + inst.id + '">' + esc(r.inst) + '</a>' : esc(r.inst)) + '</dd><dt>Contact person</dt><dd>' + esc(r.contact) + '</dd>' + (r.email ? '<dt>E-mail</dt><dd>' + esc(r.email) + '</dd>' : '') + (r.phone ? '<dt>Phone</dt><dd>' + esc(r.phone) + '</dd>' : '') + '</dl></section>';
    const hasPub = r.exps && r.exps.some(x => x.pub);
    h += '<section class="rk-sec" aria-labelledby="dc-ask"><div class="rk-sec-h"><h2 class="rb-h2" id="dc-ask">What they’re asking for</h2>' + (hasPub ? '<div class="rk-legend" aria-hidden="true"><span class="rk-legend-i"><span class="rk-swatch rk-swatch--on">' + SA.ico('rki-check', '') + '</span>Requested</span><span class="rk-legend-i"><span class="rk-swatch rk-swatch--pub"></span>Published, not requested</span><span class="rk-legend-i"><span class="rk-swatch rk-swatch--none"></span>Not published</span></div>' : '') + '</div>';
    if (r.exps && r.exps.length) {
      h += '<div class="rk-ask">' + r.exps.map(x => {
        const cells = x.pub ? '<ul class="rk-fstrip" aria-label="' + esc('Formats requested: ' + x.req.join(', ') + '. Published: ' + x.pub.join(', ') + '.') + '">' + D.FM.map(c => { const k = x.req.indexOf(c) >= 0 ? 'on' : x.pub.indexOf(c) >= 0 ? 'pub' : 'none'; return '<li class="rk-fcell rk-fcell--' + k + '"><b>' + c + (k === 'on' ? SA.ico('rki-check', '') : '') + '</b><span>' + (k === 'on' ? 'Requested' : k === 'pub' ? 'Not requested' : 'Not published') + '</span></li>'; }).join('') + '</ul>' : SA.fmtBadges(x.req, 'Formats requested: ' + x.req.join(', ') + '.');
        return '<div class="rk-askrow"><div><p class="rk-askrow-t">' + esc(x.t) + '</p>' + (x.code ? '<p class="rk-askrow-c">' + SA.code(x.code) + '<span>' + esc(x.course) + '</span></p>' : '') + '</div>' + cells + '</div>';
      }).join('') + '</div>';
    } else h += '<p class="rk-next">' + n + ' experiments are listed on the request.</p>';
    h += '</section>';
    if (existing) h += '<section class="rk-sec" aria-labelledby="dc-exist"><div class="rk-sec-h"><h2 class="rb-h2" id="dc-exist">Existing access</h2></div><p class="rk-next">' + esc(existing) + '</p></section>';
    if (r.msg) h += '<section class="rk-sec" aria-labelledby="dc-msg"><div class="rk-sec-h"><h2 class="rb-h2" id="dc-msg">Message from the requester</h2></div><blockquote class="rk-quote"><p>' + esc(r.msg) + '</p><p class="rk-quote-by">' + esc(r.contact) + ', contact person</p></blockquote></section>';
    h += '<section class="rk-sec" aria-labelledby="dc-hist"><div class="rk-sec-h"><h2 class="rb-h2" id="dc-hist">History</h2></div>' + SA.timeline(hist) + '</section>';
    if (!d) h += '<section class="rk-sec" aria-labelledby="dc-events"><div class="rk-sec-h"><h2 class="rb-h2" id="dc-events">What happens after you decide</h2><p class="rk-note">Four separate events</p></div><ol class="rk-events"><li class="rk-event"><span class="rk-event-n" aria-hidden="true">1</span><p class="rk-event-t">Institution record</p><p class="rk-event-d">Created when you approve the first request from a new institution. A record is not access.</p></li><li class="rk-event"><span class="rk-event-n" aria-hidden="true">2</span><p class="rk-event-t">Request approval</p><p class="rk-event-d">Your decision on this page. External: the request becomes Approved — payment required. Internal: approved with no payment step.</p></li><li class="rk-event"><span class="rk-event-n" aria-hidden="true">3</span><p class="rk-event-t">Payment confirmation</p><p class="rk-event-d">External only. It happens after the requester pays and is not recorded on this page.</p></li><li class="rk-event"><span class="rk-event-n" aria-hidden="true">4</span><p class="rk-event-t">Institutional access activation</p><p class="rk-event-d">Internal: when you approve. External: only after the payment is confirmed. Students get access only when the institution administrator gives it.</p></li></ol><p class="rk-event-note">Request more information keeps the request open; none of the four events happen until it is approved.</p></section>';
    h += '</div><aside class="rk-aside" id="dc-panel" aria-labelledby="dc-panel-h"><div class="rk-panel"><div class="rk-panel-head"><h2 id="dc-panel-h">Your decision</h2></div><div class="rk-panel-body">' + SA.refusalHtml(r.key);
    if (!d && !blocked) h += formHtml(r, M);
    if (d) h += doneHtml(r, M);
    if (blocked) h += '<div class="rk-notice rk-notice--paused" role="status">' + SA.ico('rki-pause', '') + '<p class="rk-notice-t">This institution is paused</p><p class="rk-notice-d">Requests from a paused institution can’t be decided. You can decide this one once the pause ends.</p><div class="rk-notice-act"><a class="rb-btn" href="#/institutions/' + r.instId + '">View institution</a></div></div>';
    return h + '</div></div></aside></div></div>';
  };

  function formHtml(r, M) {
    const f = M.f, k = r.key, b = p => 'req:' + k + '.form.' + p;
    let h = '';
    const errs = Object.keys(f.errs);
    if (errs.length) h += '<div class="rk-errsum" id="dc-errs" tabindex="-1" role="alert"><p class="rk-errsum-t">Check your decision</p><ul>' + errs.map(e => '<li><a href="#' + (e === 'fm' ? 'dc-fm-' + M.reqL[0] : ERR_TARGET[e]) + '" data-act="focusField" data-id="' + (e === 'fm' ? 'dc-fm-' + M.reqL[0] : ERR_TARGET[e]) + '">' + esc(f.errs[e]) + '</a></li>').join('') + '</ul></div>';
    const choices = [['approve', 'Approve request', 'Approve what they asked for.', false], ['smaller', 'Approve a smaller scope', r.renewal ? 'Not available for a renewal. The term continues the current plan.' : 'Fewer formats, fewer licences or a shorter term, with a reason.', !!r.renewal], ['info', 'Request more information', 'The request stays open. Your question is shown to the requester.', false]];
    h += '<fieldset class="rk-fieldset' + (f.errs.choice ? ' is-invalid' : '') + '"><legend>Decision</legend><div class="rk-choices">' + choices.map((c, i) => '<label class="rk-choice' + (c[3] ? ' is-off' : '') + '" for="dc-c' + i + '"><input type="radio" name="dc-choice" id="dc-c' + i + '" value="' + c[0] + '" data-bind="' + b('choice') + '" data-onchange="decChoice" data-key="' + k + '"' + (f.choice === c[0] ? ' checked' : '') + (c[3] ? ' disabled' : '') + '><span class="rk-choice-t">' + c[1] + '</span><span class="rk-choice-d">' + esc(c[2]) + '</span></label>').join('') + '</div>' + (f.errs.choice ? '<p class="rk-ferr" id="dc-choice-err">' + SA.ico('rki-alert', '') + esc(f.errs.choice) + '</p>' : '') + '</fieldset>';
    if (M.approving && !r.route) h += '<fieldset class="rk-fieldset' + (f.errs.route ? ' is-invalid' : '') + '"><legend>Internal or external<span>Required to approve. You set this; the requester never chooses it.</span></legend><div class="rk-choices">' +
      [['Internal', 'Internal: BITS campus or programme', 'No payment step. Institutional access is activated when you approve.'], ['External', 'External institution', 'Approval, then payment. Institutional access is activated only after the payment is confirmed.']].map((o, i) => '<label class="rk-choice" for="dc-r' + i + '"><input type="radio" name="dc-route" id="dc-r' + i + '" value="' + o[0] + '" data-bind="' + b('route') + '" data-onchange="decClear" data-key="' + k + '" data-e="route"' + (f.route === o[0] ? ' checked' : '') + '><span class="rk-choice-t">' + o[1] + '</span><span class="rk-choice-d">' + o[2] + '</span></label>').join('') + '</div>' + (f.errs.route ? '<p class="rk-ferr" id="dc-route-err">' + SA.ico('rki-alert', '') + esc(f.errs.route) + '</p>' : '') + '</fieldset>';
    if (M.approving && r.route) h += '<p class="rk-locked">' + SA.ico('rki-lock', 'xr-ico xr-ico--18') + '<span>Internal or external: <b>' + esc(r.route) + '</b>. Set when this institution was first approved.</span></p>';
    if (f.choice === 'smaller') {
      h += '<fieldset class="rk-fieldset"><legend>Formats to approve</legend><div class="rk-checks">' + M.reqL.map(x => '<label class="rk-check" for="dc-fm-' + x + '"><input type="checkbox" id="dc-fm-' + x + '" data-act-change="1" data-onchange="decFm" data-key="' + k + '" data-f="' + x + '" data-bind="req:' + k + '.form._fm"' + (M.fm[x] ? ' checked' : '') + '>' + x + ' <small>' + D.FN[x] + '</small></label>').join('') + '</div>' + (f.errs.fm ? '<p class="rk-ferr">' + SA.ico('rki-alert', '') + esc(f.errs.fm) + '</p>' : '') + '</fieldset>';
      h += '<div class="rk-field"><label class="rk-label" for="dc-lic">' + (r.more ? 'Additional licences to approve' : 'Licences to approve') + '</label><input id="dc-lic" class="rk-input" type="text" inputmode="numeric" value="' + esc(M.licIn) + '" data-bind="' + b('lic') + '" data-live="1"' + (f.errs.lic ? ' aria-invalid="true"' : '') + ' aria-describedby="dc-lic-err">' + (f.errs.lic ? '<p class="rk-ferr" id="dc-lic-err">' + SA.ico('rki-alert', '') + esc(f.errs.lic) + '</p>' : '') + '</div>';
      if (!r.termFixed) h += '<div class="rk-field"><label class="rk-label" for="dc-term">Access term</label><div class="rk-selwrap"><select id="dc-term" class="rk-select" data-bind="' + b('term') + '">' + ['Monthly', 'Quarterly', 'Yearly'].map(o => '<option' + (o === M.term ? ' selected' : '') + '>' + o + '</option>').join('') + '</select>' + SA.ico('rki-chev', '') + '</div></div>';
      else h += '<p class="rk-hint">Access term: ' + esc(M.term) + '. Additional licences follow the current term.</p>';
      if (M.diffs.length) h += '<div class="rk-diff" role="status"><b>Different from the request</b>' + M.diffs.map(x => '<p>' + esc(x) + '</p>').join('') + '</div>';
      if (f.errs.diff) h += '<p class="rk-ferr" id="dc-diff-err">' + SA.ico('rki-alert', '') + esc(f.errs.diff) + '</p>';
    }
    if (f.choice === 'smaller' || f.choice === 'info') h += '<div class="rk-field"><label class="rk-label" for="dc-reason">' + (f.choice === 'info' ? 'What do you need from the requester? (required)' : 'Reason for the change (required)') + '</label><p class="rk-hint" id="dc-reason-hint">Shown to the requester on their request status.</p><textarea id="dc-reason" class="rk-textarea" data-bind="' + b('reason') + '" data-live="1"' + (f.errs.reason ? ' aria-invalid="true"' : '') + ' aria-describedby="dc-reason-hint dc-reason-err">' + esc(f.reason) + '</textarea>' + (f.errs.reason ? '<p class="rk-ferr" id="dc-reason-err">' + SA.ico('rki-alert', '') + esc(f.errs.reason) + '</p>' : '') + '</div>';
    const pending = !f.choice ? '' : (M.approving && !M.route) ? 'Choose internal or external before approving.' : (f.choice === 'smaller' && (!M.diffs.length || !SA.T(f.reason))) ? 'Change at least one thing and give a reason before approving.' : (f.choice === 'info' && !SA.T(f.reason)) ? 'Add your question before sending.' : '';
    if (pending) h += '<p class="rk-pending">' + SA.ico('rki-clock', '') + esc(pending) + '</p>';
    h += '<button type="button" class="rb-btn rb-btn--primary rk-go" id="dc-go" data-act="decGo" data-key="' + k + '">' + (f.choice === 'info' ? 'Send request for information' : f.choice === 'smaller' ? 'Approve smaller scope' : 'Approve request') + '</button>';
    return h;
  }

  function doneHtml(r, M) {
    const s = r.dec, d = s.decided, rt = s.route || M.route, isNew = M.isNew, cur = SA.reqStatus(r);
    let stand = [];
    if (d === 'info') stand = [['Institution record', isNew ? 'Not created' : 'Exists'], ['Request', 'Information requested'], ['Payment', 'Not started'], ['Institutional access', isNew ? 'Not active' : 'Active, unchanged']];
    if (d === 'pay') stand = [['Institution record', isNew ? (s.when ? 'Created ' + s.when : 'Created') : 'Exists'], ['Request', 'Approved (' + rl(rt) + ')'], ['Payment', 'Waiting, not confirmed'], ['Institutional access', isNew ? 'Not active' : 'Active, unchanged']];
    if (d === 'active') stand = [['Institution record', isNew && s.when ? 'Created ' + s.when : 'Exists'], ['Request', 'Approved (' + rl(rt) + ')'], ['Payment', rt === 'Internal' ? 'Not needed (internal)' : (s.paid ? 'Confirmed ' + s.paid : 'Confirmed')], ['Institutional access', !isNew ? 'Active, unchanged' : rt === 'Internal' ? (s.when && !s.fromBase ? 'Active since ' + s.when : 'Active') : (s.paid ? 'Active since ' + s.paid : 'Active')]];
    if (d === 'pend') stand = [['Institution record', 'Exists'], ['Request', 'Approved (' + rl(rt) + ')'], ['Payment', 'Not confirmed']];
    const next = d === 'pay' ? (isNew ? 'The requester now sees Continue to payment on their request status. Institutional access is not active until the payment is confirmed.' : 'The requester now sees Continue to payment on their request status. Current access continues unchanged; the plan isn’t changed from this page.')
      : d === 'active' ? (r.renewal ? 'The renewal is approved. The current plan isn’t changed from this page; its term still shows as ending on 31 Oct 2026.' : isNew ? 'Institutional access is active. The institution administrator can now give students access.' : 'Institutional access is active.')
      : d === 'info' ? 'The request stays open. Your question is on the requester’s request status.' : '';
    const meta = !s.when ? '' : d === 'info' ? (s.fromBase ? 'Sent on ' + s.when + ' by Arjun Mehta' : 'Sent by you on ' + s.when) : (s.fromBase ? 'Decided on ' + s.when + ' by Arjun Mehta, ' + rl(rt) : 'Decided by you on ' + s.when + ', ' + rl(rt));
    const newInst = isNew && r.instId && SA.inst(r.instId);
    return '<div class="rk-done" id="dc-done" tabindex="-1"><p>' + SA.pill(SA.REQ_KIND[cur], SA.REQ_LBL[cur], true) + '</p>' + (meta ? '<p class="rk-done-meta">' + esc(meta) + '</p>' : '') +
      '<dl class="rk-stand">' + stand.map(x => '<div><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>').join('') + '</dl>' + (next ? '<p class="rk-next">' + esc(next) + '</p>' : '') +
      '<div class="sa-btnrow"><a class="rb-btn" href="#/requests">Back to requests</a>' + (newInst ? '<a class="rb-btn rb-btn--ghost" href="#/institutions/' + newInst.id + '">Open institution</a>' : '') + '</div></div>';
  }

  A.goPanel = () => { SA.focus('dc-panel-h'); const el = document.getElementById('dc-panel'); if (el) el.scrollIntoView({ block: 'start' }); document.getElementById('dc-panel-h').setAttribute('tabindex', '-1'); };
  A.focusField = d => SA.focus(d.id);
  A.decChoice = d => { const r = SA.req(d.key); r.form.errs = {}; };
  A.decClear = d => { const r = SA.req(d.key); delete r.form.errs[d.e]; };
  A.decFm = (d, el) => { const r = SA.req(d.key), M = model(r); r.form.fm = Object.assign({}, M.fm, { [d.f]: el.checked }); delete r.form.errs.fm; };
  A.decGo = d => {
    const r = SA.req(d.key), M = model(r), e = M.validate();
    if (Object.keys(e).length) { r.form.errs = e; SA.render(); SA.focus('dc-errs'); return; }
    r.form.errs = {};
    if (r.form.choice === 'info') { if (SA.staleGuard(r.key)) return; commit(r, 'info'); return; }
    SA.openDlg({ type: 'approveReq', key: r.key, opener: 'dc-go' });
  };
  function commit(r, decided) {
    const M = model(r), when = SA.now(), S = SA.S, f = r.form;
    r.dec = { decided, choice: f.choice, route: decided === 'info' ? f.route : M.route, reason: SA.T(f.reason), when, fromBase: false };
    if (decided !== 'info') {
      if (M.isNew) {
        const exps = r.exps.map(x => [x.t, x.code, f.choice === 'smaller' ? M.reqL.filter(c => M.fm[c]) : x.req, x.pub || x.req]);
        const lic = f.choice === 'smaller' ? String(M.licIn) : r.licNum, term = f.choice === 'smaller' ? M.term : r.term;
        const id = r.instId || r.key; r.instId = id;
        const inst = { id, name: r.inst, kind: M.route, base: M.route === 'Internal' ? 'live' : 'payment', createdIso: S.A.iso, ia: '', students: 0, faculty: 0, reqKey: r.key, noIaSinceIso: S.A.iso, requested: exps, reqLic: lic, plans: [], report: [],
          hist: [] };
        if (M.route === 'Internal') {
          const start = S.A.iso, ey = Number(start.slice(0, 4)) + (term === 'Yearly' ? 1 : 0), em = Number(start.slice(5, 7)) + (term === 'Monthly' ? 1 : term === 'Quarterly' ? 3 : 0);
          const endD = new Date(Date.UTC(ey, em - 1, Number(start.slice(8, 10)) - 1)); const endIso = endD.toISOString().slice(0, 10);
          inst.plans = [{ key: 'p1', exps, lic, term, startIso: start, endIso }];
          inst.hist.push(['Institutional access activated', when, 'Internal, no payment step. Access plan created.', S.A.iso]);
        }
        inst.hist.push(['Request approved' + (M.route === 'External' ? ', payment required' : ''), when, rl(M.route).replace(/^./, c => c.toUpperCase()) + '. Institution record created by this approval.', S.A.iso]);
        S.insts = S.insts.filter(i => i.id !== id).concat([inst]);
      } else {
        const inst = SA.inst(r.instId);
        if (inst) inst.hist.unshift([(r.renewal ? 'Renewal approved' : 'Request for ' + r.lic + ' licences approved') + (M.route === 'External' ? ', payment required' : ''), when, 'Decided by Arjun Mehta. The current plan is not changed from the request page.', S.A.iso]);
      }
    }
    SA.render(); SA.focus('dc-done');
  }
  SA.DLG.approveReq = dl => {
    const r = SA.req(dl.key), M = model(r), f = r.form, now = [], later = [];
    if (M.isNew) now.push('Creates the institution record for ' + r.inst + ', classified ' + rl(M.route) + '.');
    if (M.route === 'External') {
      now.push('Approves the request. Its status becomes Approved — payment required.');
      later.push(M.isNew ? 'Institutional access is not activated now. It is activated only after the payment is confirmed.' : 'Payment is confirmed outside this page. Current access continues unchanged, and the plan isn’t changed from here.');
    } else if (r.renewal) {
      now.push('Approves the renewal. There is no payment step.');
      later.push('This page does not change the current plan. Its term still shows as ending on 31 Oct 2026.');
    } else {
      now.push('Approves the request. There is no payment step.');
      now.push('Institutional access is activated now and the access plan is created.');
    }
    if (f.choice === 'smaller') now.push('The requester sees what changed and your reason.');
    later.push('Students get access only when the institution’s administrator gives it.');
    return { title: (f.choice === 'smaller' ? 'Approve a smaller scope for ' : r.renewal ? 'Approve the renewal from ' : 'Approve the request from ') + r.inst + '?', desc: 'Check what approving does now, and what happens only after later events.', body: SA.dlgList(now, later),
      ok: f.choice === 'smaller' ? 'Approve smaller scope' : 'Approve request', run: () => { if (SA.staleGuard(r.key)) return; SA.S.dlg = null; commit(r, M.route === 'Internal' ? 'active' : 'pay'); } };
  };
})();
