/* Super Admin · SA-06 Institutions, SA-07 Institution detail
   Behaviour from v46 B7-02 / B7-03 / B7-04; presentation in the Refined B kit (RequestTable, DetailLayout, PlanBand, DecisionPanel). */
(function () {
  const SA = window.SA, D = SA.D, esc = SA.esc, V = SA.V, A = SA.A;
  const FILTERS = [['all', 'All statuses'], ['active', 'Access active'], ['ending', 'Ending soon'], ['paused', 'Access paused'], ['payment', 'Approved — payment required'], ['ended', 'Access ended'], ['noia', 'No Institute Admin']];
  const match = (i, f) => f === 'all' || (f === 'noia' ? SA.noIA(i) : SA.instStatus(i) === f);
  const courses = i => Array.from(new Set(i.plans.reduce((a, p) => a.concat(p.exps.map(e => e[1])), [])));
  const expCount = i => i.plans.reduce((n, p) => n + p.exps.length, 0);

  /* ═══ SA-06 Institutions ═══════════════════════════════════════════════════ */
  V.institutions = () => {
    const S = SA.S, L = S.ui.instList, mode = SA.listMode(), q = SA.T(L.q).toLowerCase();
    const all = S.insts.slice().sort((a, b) => a.name.localeCompare(b.name));
    const list = all.filter(i => match(i, L.f) && (!q || (i.name + ' ' + (i.ia || '')).toLowerCase().indexOf(q) >= 0));
    const chips = []; if (q) chips.push(['q', 'Search: “' + SA.T(L.q) + '”']); if (L.f !== 'all') chips.push(['f', 'Status: ' + FILTERS.find(f => f[0] === L.f)[1]]);
    let h = '<div class="rk-head"><div class="rk-head-text"><p class="rb-eyebrow-date">' + esc(S.A.long) + '</p><h1 class="rb-h1" id="page-h1" tabindex="-1">Institutions</h1><p class="rk-sub">Every institution on the platform. Each one is created when a request is approved.</p></div></div>';
    h += '<section class="rk-surface" aria-label="Institutions">';
    if (mode !== 'empty') {
      h += '<div class="rk-toolbar"><div class="rk-tools" role="search" aria-label="Filter institutions"><div class="rk-field rk-search"><label class="rk-label" for="in-q">Search</label><div class="rk-inputwrap">' + SA.ico('rki-search', '') + '<input id="in-q" class="rk-input" type="search" placeholder="Institution or Institute Admin" autocomplete="off" value="' + esc(L.q) + '" data-bind="ui.instList.q" data-live="1"></div></div>' +
        '<div class="rk-field rk-field--st"><label class="rk-label" for="in-st">Status</label><div class="rk-selwrap"><select id="in-st" class="rk-select" data-bind="ui.instList.f">' + FILTERS.map(f => '<option value="' + f[0] + '"' + (f[0] === L.f ? ' selected' : '') + '>' + esc(f[1]) + ' (' + all.filter(i => match(i, f[0])).length + ')</option>').join('') + '</select>' + SA.ico('rki-chev', '') + '</div></div></div>';
      if (mode === 'ok' || chips.length) h += '<div class="rk-statusline">' + (mode === 'ok' ? '<p class="rk-count" role="status">' + (chips.length ? list.length + ' of ' + SA.plural(all.length, 'institution') : SA.plural(all.length, 'institution')) + '</p>' : '') + chips.map(c => '<span class="rk-chip">' + esc(c[1]) + '<button type="button" aria-label="Remove filter ' + esc(c[1]) + '" data-act="inChip" data-k="' + c[0] + '">' + SA.ico('rki-x', '') + '</button></span>').join('') + (chips.length ? '<button type="button" class="rk-clear" data-act="inClear">Clear filters</button>' : '') + '</div>';
      h += '</div>';
    }
    if (mode !== 'ok') h += SA.listState(mode, { loading: 'Loading institutions…', failed: 'We couldn’t load the institutions', emptyT: 'No institutions yet', emptyD: 'An institution appears here when you approve its first request.' });
    else if (!list.length) h += SA.listState('none', { noneT: 'No institutions match', noneD: 'Try another name or clear the filters.', clearAct: 'inClear' });
    else h += '<div class="rk-tablewrap"><table class="rk-table"><caption>Institutions, by name</caption><thead><tr><th scope="col" class="rk-c-inst">Institution</th><th scope="col" class="rk-c-exp">Access plan</th><th scope="col" class="rk-c-type">Institute Admin</th><th scope="col" class="rk-c-date">Access ends</th><th scope="col" class="rk-c-st">Status</th></tr></thead><tbody>' +
      list.map(i => {
        const st = SA.instStatus(i), end = SA.instEnd(i);
        const plan = i.plans.length ? SA.plural(courses(i).length, 'course') + ' · ' + SA.plural(expCount(i), 'experiment') + (i.plans.length > 1 ? ' · ' + i.plans.length + ' plans' : '') : 'No access plan yet · ' + SA.plural((i.requested || []).length, 'experiment') + ' requested';
        return '<tr data-href="#/institutions/' + i.id + '"><td class="rk-c-inst"><a class="rk-rowlink" href="#/institutions/' + i.id + '" aria-label="' + esc(i.name + ', ' + SA.INST_LBL[st] + (SA.noIA(i) ? ', no Institute Admin' : '') + '. Open the institution') + '">' + esc(i.name) + '</a><span class="rk-small">' + esc(i.kind) + '</span></td>' +
          '<td class="rk-c-exp"><span class="rk-strong">' + esc(plan) + '</span></td>' +
          '<td class="rk-c-type">' + (i.ia ? '<span class="rk-strong">' + esc(i.ia) + '</span>' : SA.noIA(i) ? '<span class="rk-tag-warn">' + SA.ico('rbi-userminus', '') + 'Needs one</span>' : '<span class="rk-small">Assigned once access is active</span>') + '</td>' +
          '<td class="rk-c-date">' + (end ? (st === 'ended' ? 'Ended ' + esc(SA.dmy(end)) : '<span class="rk-inlabel">Access ends </span>' + esc(SA.dmy(end))) : '<span class="rk-inlabel">Access ends: </span>not set yet') + '</td><td class="rk-c-st">' + SA.pill(SA.INST_KIND[st], SA.INST_LBL[st]) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    h += '<p class="rk-ca-foot">Institutions are created only by approving a request. A plan can’t be amended here; changes come through a new request.</p>';
    return h + '</section>';
  };
  A.inChip = d => { const L = SA.S.ui.instList; if (d.k === 'q') L.q = ''; else L.f = 'all'; SA.render(); SA.focus('in-q'); };
  A.inClear = () => { Object.assign(SA.S.ui.instList, { q: '', f: 'all' }); SA.render(); SA.focus('in-q'); };

  /* ═══ SA-07 Institution detail ═════════════════════════════════════════════ */
  function term(p, st) {
    const iso = SA.S.A.iso;
    if (!p.startIso) {
      const left = SA.days(iso, p.endIso);
      return '<div class="rb-term rk-plan-term"><div class="rb-term-top"><span class="rb-term-label">' + esc(p.term) + ' term</span><span class="rb-term-left' + (left <= 15 ? '' : ' rb-term-left--calm') + '">' + (left >= 0 ? SA.plural(left, 'day') + ' left' : 'Ended') + '</span></div><p class="sa-term-only">Ends ' + esc(SA.dmy(p.endIso)) + '. The start date isn’t part of this record.</p></div>';
    }
    const total = Math.max(1, SA.days(p.startIso, p.endIso)), done = Math.min(total, Math.max(0, SA.days(p.startIso, iso)));
    const pct = Math.round(done / total * 1000) / 10, left = SA.days(iso, p.endIso), ended = left < 0, paused = st === 'paused';
    const leftTxt = ended ? 'Ended ' + SA.plural(-left, 'day') + ' ago' : paused ? 'Paused · ' + SA.plural(left, 'day') + ' left' : SA.plural(left, 'day') + ' left';
    const aria = esc(p.term + ' term from ' + SA.dmy(p.startIso) + ' to ' + SA.dmy(p.endIso) + '. ' + leftTxt + '.');
    const fill = ended ? 100 : pct;
    return '<div class="rb-term rk-plan-term" role="img" aria-label="' + aria + '"><div class="rb-term-top"><span class="rb-term-label">' + esc(p.term) + ' term</span><span class="rb-term-left' + (left <= 15 && !ended ? '' : ' rb-term-left--calm') + (paused ? ' rk-term-paused' : '') + '">' + esc(leftTxt) + '</span></div>' +
      '<div class="rb-term-track' + (paused ? ' rk-track-paused' : '') + (fill >= 100 ? ' rk-track-full' : '') + '"><span class="rb-term-fill" style="width: ' + fill + '%"></span>' + (!ended && left <= 15 && !paused ? '<span class="rb-term-rest" style="width: ' + (100 - pct) + '%"></span>' : '') + (!ended ? '<span class="rb-term-today" style="left: ' + pct + '%"></span>' : '') + '</div>' +
      '<div class="rb-term-ends"><span>' + esc(SA.dmy(p.startIso)) + '</span><span>' + esc(SA.dmy(p.endIso)) + '</span></div></div>';
  }
  function planBand(i, p, st, idx) {
    const iso = SA.S.A.iso, pst = p.endIso < iso ? 'ended' : st === 'paused' ? 'paused' : SA.days(iso, p.endIso) <= 15 ? 'ending' : 'active';
    const ren = i.renewalKey && SA.req(i.renewalKey), renOpen = ren && SA.reqStatus(ren) === 'review';
    let note = '';
    if (pst === 'ending' && p.lic === (ren && ren.licNum)) note = '<div class="rk-plan-note rk-plan-note--warn">' + SA.ico('rki-cal', '') + '<div><p class="rk-plan-note-t">Ends on ' + esc(SA.dmy(p.endIso)) + '</p><p class="rk-plan-note-d">' + (renOpen ? 'Its renewal request is under review.' : 'Its renewal was approved. This page does not change the term.') + '</p></div><a class="rb-btn rb-btn--navy" href="#/requests/' + ren.key + '">' + (renOpen ? 'Open renewal request' : 'View renewal') + '</a></div>';
    else if (pst === 'ending') note = '<div class="rk-plan-note rk-plan-note--warn">' + SA.ico('rki-cal', '') + '<div><p class="rk-plan-note-t">Ends on ' + esc(SA.dmy(p.endIso)) + '</p><p class="rk-plan-note-d">' + (ren ? 'Not covered by the renewal request. ' : '') + 'Reminder due. Nothing is sent from here.</p></div><a class="rb-btn" href="#/operations/access-ending">View access ending</a></div>';
    else if (pst === 'paused') note = '<div class="rk-plan-note rk-plan-note--paused">' + SA.ico('rki-lock', '') + '<div><p class="rk-plan-note-t">Read-only while access is paused</p><p class="rk-plan-note-d">Students can’t open its experiments. Everyone’s work is kept.</p></div></div>';
    else if (pst === 'ended') note = '<div class="rk-plan-note rk-plan-note--off">' + SA.ico('rki-ended', '') + '<div><p class="rk-plan-note-t">This plan ended on ' + esc(SA.dmy(p.endIso)) + '</p><p class="rk-plan-note-d">Ended access comes back only through a renewal request.</p></div></div>';
    const plst = { active: ['ok', 'Active'], ending: ['warn', 'Ending soon'], paused: ['paused', 'Paused'], ended: ['ended', 'Ended'] }[pst];
    return '<section class="rk-plan" aria-labelledby="pl-' + idx + '"><div class="rk-plan-grid"><div class="rk-plan-id"><p class="rk-plan-k">Access plan' + (i.plans.length > 1 ? ' ' + (idx + 1) + ' of ' + i.plans.length : '') + '</p><div class="rk-plan-name"><h2 id="pl-' + idx + '">' + esc(SA.plural(p.exps.length, 'experiment') + ' · ' + p.lic + ' licences') + '</h2>' + SA.pill(plst[0], plst[1]) + '</div><p class="rk-plan-line">' + esc(p.lic) + ' licences, as approved. How licences are counted is still open.</p></div>' + term(p, st) + '</div>' +
      '<div class="sa-plan-exps">' + p.exps.map(e => '<div class="sa-plan-exp"><div class="sa-plan-exp-t"><p class="rk-askrow-t">' + esc(e[0]) + '</p><p class="rk-askrow-c">' + SA.code(e[1]) + '<span>' + esc(SA.courseName(e[1])) + '</span></p></div><ul class="rk-fstrip" aria-label="' + esc('In the plan: ' + e[2].join(', ') + '. Published: ' + (e[3] || e[2]).join(', ') + '.') + '">' + D.FM.map(c => { const k = e[2].indexOf(c) >= 0 ? 'on' : (e[3] || []).indexOf(c) >= 0 ? 'pub' : 'none'; return '<li class="rk-fcell rk-fcell--' + k + '"><b>' + c + (k === 'on' ? SA.ico('rki-check', '') : '') + '</b><span>' + (k === 'on' ? 'In the plan' : k === 'pub' ? 'Not in the plan' : 'Not published') + '</span></li>'; }).join('') + '</ul></div>').join('') + '</div>' + note + '</section>';
  }

  V.institution = (i, sub) => {
    const S = SA.S, st = SA.instStatus(i), noIa = SA.noIA(i), paused = st === 'paused', ia = i.ia;
    const canPause = st === 'active' || st === 'ending', canRestore = paused;
    let h = SA.crumbs([['Institutions', '#/institutions'], [i.name]]) +
      '<div class="rk-head"><div class="rk-head-text"><p class="rb-eyebrow-date">' + esc(S.A.long) + '</p><p class="rk-eyebrow">' + esc(i.kind) + ' institution</p><h1 class="rk-title" id="page-h1" tabindex="-1">' + esc(i.name) + '</h1><div class="rk-meta">' + SA.pill(SA.INST_KIND[st], SA.INST_LBL[st], true) + '<span>Institute Admin: ' + esc(ia || (st === 'payment' ? 'assigned once access is active' : 'not assigned')) + '</span></div></div><a class="rb-btn rk-goto" href="#in-panel" data-act="goInPanel">Go to actions</a></div>';
    h += SA.flashHtml('inst-' + i.id);
    if (paused) h += '<div class="rk-banner" role="status">' + SA.ico('rki-pause', '') + '<p>Access paused' + (i.pause.when ? ' on ' + esc(i.pause.when.split(',')[0]) : '') + '. Students can’t open experiments. Everyone’s work is kept.</p></div>';
    if (noIa) h += SA.notice('warn', 'rbi-userminus', 'No Institute Admin', 'Nobody at this institution can give students access until you assign one.');
    const facts = [['Status', SA.INST_LBL[st]], ['Internal or external', i.kind], ['Institute Admin', ia || 'Not assigned', !ia], ['People', i.students + ' students · ' + i.faculty + ' Faculty']];
    h += '<div class="rk-detailwrap"><div class="rk-detail"><div class="sa-stack"><div class="rk-surface rk-mainsheet"><dl class="rk-factstrip">' + facts.map(x => '<div class="rk-fact"><dt>' + esc(x[0]) + '</dt><dd' + (x[2] ? ' class="is-quiet"' : '') + '>' + esc(x[1]) + '</dd></div>').join('') + '</dl>';
    if (paused && i.pause.reason) h += '<section class="rk-sec" aria-labelledby="in-pr"><div class="rk-sec-h"><h2 class="rb-h2" id="in-pr">Why access is paused</h2></div><blockquote class="rk-quote"><p>' + esc(i.pause.reason) + '</p><p class="rk-quote-by">Arjun Mehta' + (i.pause.when ? ', ' + esc(i.pause.when) : '') + '</p></blockquote><p class="rk-next" style="margin-top:12px">Its Institute Admin, Faculty and Students see “Your institution’s access is paused — your work is kept.”</p></section>';
    if (!i.plans.length) {
      const rq = i.reqKey && SA.req(i.reqKey);
      h += '<section class="rk-sec" aria-labelledby="in-np"><div class="rk-sec-h"><h2 class="rb-h2" id="in-np">Access plan</h2></div><p class="rk-next">No access plan yet. It is created when the payment for the approved request is confirmed. Payment isn’t recorded here.</p>' +
        (i.requested ? '<div class="rk-ask" style="margin-top:14px">' + i.requested.map(e => '<div class="rk-askrow"><div><p class="rk-askrow-t">' + esc(e[0]) + '</p><p class="rk-askrow-c">' + SA.code(e[1]) + '<span>' + esc(SA.courseName(e[1])) + '</span></p></div>' + SA.fmtBadges(e[2], 'Formats approved: ' + e[2].join(', ')) + '</div>').join('') + '</div>' : '') +
        (rq ? '<p class="rk-next" style="margin-top:12px"><a class="rb-link" href="#/requests/' + rq.key + '">Open the approved request</a></p>' : '') + '</section>';
    }
    h += '</div>';
    if (i.plans.length) h += i.plans.map((p, x) => planBand(i, p, st, x)).join('') + '<p class="sa-footnote">A plan can’t be amended here; changes come through a new request.</p>';
    h += '<div class="rk-surface">';
    if (i.report.length) h += '<section class="rk-sec" aria-labelledby="in-rep"><div class="rk-sec-h"><h2 class="rb-h2" id="in-rep">Activity by format</h2><p class="rk-note">Sample figures up to ' + esc(S.A.short) + '</p></div><div class="sa-tablewrap"><table class="sa-table sa-table--rows"><caption class="xr-sr">Students with access and activity by format</caption><thead><tr><th scope="col">Experiment</th><th scope="col">Students with access</th><th scope="col">By format</th></tr></thead><tbody>' + i.report.map(x => '<tr><th scope="row">' + esc(x[0]) + '</th><td class="xr-num" data-label="Students with access">' + x[1] + '</td><td data-label="By format"><ul class="sa-byfmt">' + x[2].map(f => '<li><span class="xr-fmt">' + f[0] + '</span> ' + f[1] + ' started · ' + f[2] + ' completed</li>').join('') + '</ul></td></tr>').join('') + '</tbody></table></div><p class="rk-hint" style="margin-top:10px">Per format, never added up into one figure. Student feedback is not shown here.</p></section>';
    if (i.id === 'godavari' && S.students.length) {
      h += '<section class="rk-sec" aria-labelledby="in-ppl"><div class="rk-sec-h"><h2 class="rb-h2" id="in-ppl">People</h2><p class="rk-note">' + esc(i.students + ' students · ' + i.faculty + ' Faculty') + '</p></div><p class="rk-next" style="margin-bottom:12px">The Institute Admin manages people. A status change here is an override with a reason.</p><ul class="sa-people">' + S.students.map((x, n) => {
        const open = S.inline && S.inline.type === 'stu' && S.inline.n === n, to = x.st === 'active' ? 'Inactive' : 'Active';
        return '<li><div class="sa-people-row"><div><p class="sa-people-n">' + esc(x.n) + '</p><p class="rk-small">' + esc(x.id) + '</p></div>' + SA.pill(x.st === 'active' ? 'ok' : 'ended', x.st === 'active' ? 'Active' : 'Inactive') + (open ? '' : '<button type="button" class="rb-btn rb-btn--ghost" id="stu-btn-' + n + '" data-act="stuOpen" data-n="' + n + '" aria-label="Change status for ' + esc(x.n) + '">Change status</button>') + '</div>' +
          (open ? '<div class="sa-inline">' + SA.field({ id: 'stu-r-' + n, label: 'Reason for changing the status to ' + to, hint: 'An override, kept in the history. The Institute Admin normally changes this.', bind: 'inline.reason', value: S.inline.reason, textarea: true, err: S.inline.err }) + '<div class="sa-btnrow"><button type="button" class="rb-btn rb-btn--navy" data-act="stuSave" data-n="' + n + '">Change to ' + to + '</button><button type="button" class="rb-btn" data-act="stuCancel" data-n="' + n + '">Cancel</button></div></div>' : '') + '</li>';
      }).join('') + '</ul><p class="rk-hint" style="margin-top:10px">Student names are sample data for Godavari Institute of Technology only.</p></section>';
    } else h += '<section class="rk-sec" aria-labelledby="in-ppl"><div class="rk-sec-h"><h2 class="rb-h2" id="in-ppl">People</h2></div><p class="rk-next">' + esc(i.students || i.faculty ? i.students + ' students and ' + i.faculty + ' Faculty. Their names aren’t part of this sample.' : 'Nobody has been added yet. The Institute Admin adds students and Faculty.') + '</p></section>';
    h += '<section class="rk-sec" aria-labelledby="in-hist"><div class="rk-sec-h"><h2 class="rb-h2" id="in-hist">History</h2><p class="rk-note">Newest first</p></div>' + SA.timeline(SA.histFilter(i.hist)) + '</section></div></div>';

    /* actions panel */
    h += '<aside class="rk-aside" id="in-panel" aria-labelledby="in-panel-h"><div class="rk-panel"><div class="rk-panel-head"><h2 id="in-panel-h" tabindex="-1">What you can do</h2></div><div class="rk-panel-body">';
    h += '<div class="sa-act"><p class="sa-act-k">Institute Admin</p>' + (ia ? '<p class="sa-act-v">' + esc(ia) + (i.iaEmail ? '<span>' + esc(i.iaEmail) + '</span>' : '') + '</p>' : st === 'payment' ? '<p class="rk-hint">The Institute Admin is assigned once access is active.</p>' : '<p class="rk-hint">Not assigned. They manage people, groups and student access for this institution.</p><button type="button" class="rb-btn rb-btn--primary rk-go" id="in-assign" data-act="instAssign" data-id="' + i.id + '">Assign Institute Admin</button>') + '</div>';
    h += '<div class="sa-act"><p class="sa-act-k">Access</p>';
    if (canPause) h += '<p class="rk-hint">Pausing stops students opening experiments. It is reversible and everyone’s work is kept.</p><button type="button" class="rb-btn" id="in-pause" data-act="instPause" data-id="' + i.id + '">Pause access</button>';
    else if (canRestore) h += '<p class="rk-hint">Restoring lets everyone work again on the experiments in its access plan.</p><button type="button" class="rb-btn' + (ia ? ' rb-btn--primary' : '') + '" id="in-restore" data-act="instRestore" data-id="' + i.id + '">Restore access</button>';
    else if (st === 'payment') h += '<p class="rk-hint">No status action here. Payment is confirmed on the request, outside this page.</p>' + (i.reqKey ? '<a class="rb-btn" href="#/requests/' + i.reqKey + '">Open request</a>' : '');
    else h += '<p class="rk-hint">No status action here. Ended access comes back only through a renewal request.</p>';
    h += '</div>';
    const att = [];
    S.requests.filter(r => r.instId === i.id && SA.reqStatus(r) === 'review').forEach(r => att.push([r.type + ' request under review', '#/requests/' + r.key, 'Open request']));
    S.transfers.filter(t => t.instId === i.id && t.st === 'forwarded').forEach(t => att.push([t.fmt + ' device transfer for ' + t.student, '#/operations/device-transfers/' + t.id, 'Review transfer']));
    h += '<div class="sa-act"><p class="sa-act-k">Also waiting for this institution</p>' + (att.length ? '<ul class="sa-attn">' + att.map(a => '<li><span>' + esc(a[0]) + '</span><a class="rb-link" href="' + a[1] + '">' + esc(a[2]) + '</a></li>').join('') + '</ul>' : '<p class="rk-hint">Nothing else needs you here.</p>') + '</div>';
    h += '</div></div></aside></div></div>';
    return h;
  };
  A.goInPanel = () => { const el = document.getElementById('in-panel'); if (el) el.scrollIntoView({ block: 'start' }); SA.focus('in-panel-h'); };
  A.stuOpen = d => { SA.S.inline = { type: 'stu', n: Number(d.n), reason: '', err: '' }; SA.render(); SA.focus('stu-r-' + d.n); };
  A.stuCancel = d => { SA.S.inline = null; SA.render(); SA.focus('stu-btn-' + d.n); };
  A.stuSave = d => {
    const S = SA.S, n = Number(d.n), x = S.students[n], i = SA.inst('godavari');
    if (!SA.T(S.inline.reason)) { S.inline.err = 'Add a reason — it is kept in the history'; SA.render(); SA.focus('stu-r-' + n); return; }
    const to = x.st === 'active' ? 'inactive' : 'active', when = SA.now();
    x.st = to; i.hist.unshift(['Student status changed: ' + x.n + ' → ' + (to === 'active' ? 'Active' : 'Inactive'), when, '“' + SA.T(S.inline.reason) + '” · Arjun Mehta', S.A.iso]);
    S.inline = null; SA.setFlash('inst-' + i.id, x.n + ' is now ' + to + '.', 'The change and your reason are in the history.'); SA.render(); SA.focus('sa-flash');
  };

  /* dialogs: assign Institute Admin, pause, restore */
  const allEmails = () => { const S = SA.S, out = {}; S.insts.forEach(i => { if (i.iaEmail) out[i.iaEmail.toLowerCase()] = i.ia; }); S.holders.forEach(h => { out[h.email.toLowerCase()] = h.name; }); S.requests.forEach(r => { if (r.email && !out[r.email.toLowerCase()]) out[r.email.toLowerCase()] = r.contact; }); out[D.SA.email] = D.SA.name; return out; };
  SA.allEmails = allEmails;
  A.instAssign = d => SA.openDlg({ type: 'assignIA', id: d.id, name: '', email: '', opener: 'in-assign' }, 'dlg-ia-n');
  A.instPause = d => SA.openDlg({ type: 'pause', id: d.id, reason: '', opener: 'in-pause' }, 'dlg-reason');
  A.instRestore = d => SA.openDlg({ type: 'restore', id: d.id, reason: '', opener: 'in-restore' }, 'dlg-reason');
  const busyThen = (fn) => { SA.S.dlg.busy = true; SA.render(); window.setTimeout(fn, 600); };
  SA.busyThen = busyThen;
  SA.DLG.assignIA = dl => {
    const i = SA.inst(dl.id);
    return { title: 'Assign the Institute Admin for ' + i.name, desc: 'They manage people, groups and student access for this institution. Nothing is sent from here; how they first sign in is still open.', ok: 'Assign', busyLabel: 'Assigning…',
      body: SA.field({ id: 'dlg-ia-n', label: 'Name', bind: 'dlg.name', value: dl.name, err: dl.errs.n }) + SA.field({ id: 'dlg-ia-e', label: 'Work e-mail', bind: 'dlg.email', value: dl.email, type: 'email', err: dl.errs.e }),
      run: () => {
        const e = {}, n = SA.T(dl.name), m = SA.T(dl.email).toLowerCase(), taken = allEmails()[m];
        if (!n) e.n = 'Enter the person’s name';
        if (!m) e.e = 'Enter a work e-mail address'; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)) e.e = 'Enter an e-mail address like name@institution.edu.in'; else if (taken) e.e = 'This e-mail already belongs to another person’s sign-in (' + taken + '). Use the new Institute Admin’s own work e-mail.';
        if (Object.keys(e).length) { dl.errs = e; SA.render(); SA.focus(e.n ? 'dlg-ia-n' : 'dlg-ia-e'); return; }
        busyThen(() => { const when = SA.now(); i.ia = n; i.iaEmail = m; i.hist.unshift(['Institute Admin assigned: ' + n, when, m + ' · Arjun Mehta', SA.S.A.iso]); SA.S.dlg = null;
          SA.setFlash('inst-' + i.id, n + ' is now the Institute Admin for ' + i.name + '.', 'Nothing is sent from here. How they first sign in is still open.'); SA.render(); SA.focus('sa-flash'); });
      } };
  };
  SA.DLG.pause = dl => {
    const i = SA.inst(dl.id);
    return { title: 'Pause access for ' + i.name + '?', desc: 'Its Institute Admin, Faculty and Students see “Your institution’s access is paused — your work is kept.” Students can’t open experiments until you restore access. The access plan and everyone’s work are kept.', ok: 'Pause access', busyLabel: 'Pausing…',
      body: SA.field({ id: 'dlg-reason', label: 'Reason, kept in the history', bind: 'dlg.reason', value: dl.reason, textarea: true, err: dl.errs.r }) + (SA.S.requests.some(r => r.instId === i.id && SA.reqStatus(r) === 'review') ? '<p class="rk-hint">Its open request can’t be decided while access is paused.</p>' : ''),
      run: () => {
        if (!SA.T(dl.reason)) { dl.errs = { r: 'Add a reason — it is kept in the history' }; SA.render(); SA.focus('dlg-reason'); return; }
        busyThen(() => { const when = SA.now(); i.pause = { iso: SA.S.A.iso, when, reason: SA.T(dl.reason) }; i.hist.unshift(['Access paused by Arjun Mehta', when, '“' + SA.T(dl.reason) + '”', SA.S.A.iso]); SA.S.dlg = null;
          SA.setFlash('inst-' + i.id, 'Access paused.', 'Everyone at ' + i.name + ' now sees the paused banner. Their work is kept.'); SA.render(); SA.focus('sa-flash'); });
      } };
  };
  SA.DLG.restore = dl => {
    const i = SA.inst(dl.id);
    return { title: 'Restore access for ' + i.name + '?', desc: 'Everyone at ' + i.name + ' can work again on the experiments in its access plan. The pause and your reason stay in the history.', ok: 'Restore access', busyLabel: 'Restoring…',
      body: SA.field({ id: 'dlg-reason', label: 'Reason, kept in the history', bind: 'dlg.reason', value: dl.reason, textarea: true, err: dl.errs.r }),
      run: () => {
        if (!SA.T(dl.reason)) { dl.errs = { r: 'Add a reason — it is kept in the history' }; SA.render(); SA.focus('dlg-reason'); return; }
        busyThen(() => { const when = SA.now(); delete i.pause; i.hist.unshift(['Access restored by Arjun Mehta', when, '“' + SA.T(dl.reason) + '”', SA.S.A.iso]); SA.S.dlg = null;
          SA.setFlash('inst-' + i.id, 'Access restored.', i.name + ' can work again.'); SA.render(); SA.focus('sa-flash'); });
      } };
  };
})();
