/* Super Admin · SA-10 Content updates, SA-11 Release or hold, SA-12 All content, SA-13 Content record,
   SA-14 Academic structure, SA-15 Area / course record. Behaviour from v46 B7-05 / B7-06 / B7-07 / B7-11. */
(function () {
  const SA = window.SA, D = SA.D, esc = SA.esc, V = SA.V, A = SA.A;
  const UPD_LBL = { awaiting: 'Waiting for your decision', hold: 'On hold', released: 'Released', returned: 'With the Content Manager' };
  const UPD_KIND = { awaiting: 'warn', hold: 'paused', released: 'ok', returned: 'info' };
  const contentTabs = cur => '<nav class="rk-tabs sa-tabs" aria-label="Content"><a class="rk-tab" href="#/content/updates"' + (cur === 'upd' ? ' aria-current="page"' : '') + '>Updates</a><a class="rk-tab" href="#/content/all"' + (cur === 'all' ? ' aria-current="page"' : '') + '>All content</a></nav>';
  const contentHead = (sub) => '<div class="rk-head"><div class="rk-head-text"><p class="rb-eyebrow-date">' + esc(SA.S.A.long) + '</p><h1 class="rb-h1" id="page-h1" tabindex="-1">Content</h1><p class="rk-sub">' + esc(sub) + '</p></div></div>';
  const seg = (items, cur, act, label) => '<div class="rb-switchbar sa-seg"><div class="rb-switch" role="group" aria-label="' + esc(label) + '">' + items.map(x => '<button type="button" id="seg-' + x[0] + '" aria-pressed="' + (x[0] === cur ? 'true' : 'false') + '" data-act="' + act + '" data-k="' + x[0] + '">' + esc(x[1]) + '<b>' + x[2] + '</b></button>').join('') + '</div></div>';
  SA.seg = seg;

  /* ═══ SA-10 Content updates ════════════════════════════════════════════════ */
  V.updates = () => {
    const S = SA.S, tab = S.ui.updTab, mode = SA.listMode();
    const vis = S.updates.filter(u => !u.notForSA);
    const tabs = [['awaiting', 'Waiting for your decision'], ['hold', 'On hold'], ['released', 'Released']].map(t => t.concat([vis.filter(u => u.st === t[0]).length]));
    const list = vis.filter(u => u.st === tab);
    let h = contentHead('Corrections to published experiments reach you after the Academic Reviewer approves them. Nothing goes live until you release it.') + contentTabs('upd');
    h += '<section class="rk-surface" aria-label="Corrections to published content"><div class="rk-toolbar">' + seg(tabs, tab, 'updTab', 'Show corrections') + '</div>';
    if (mode !== 'ok') h += SA.listState(mode, { loading: 'Loading corrections…', failed: 'We couldn’t load the corrections', emptyT: 'No corrections yet', emptyD: 'Corrections reach you after the Academic Reviewer approves them.', emptyIco: 'rbi-edit' });
    else if (!list.length) h += '<div class="rk-state"><span class="rk-state-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#rbi-edit"></use></svg></span><p class="rk-state-t">' + esc(tab === 'awaiting' ? 'Nothing is waiting for your release decision' : tab === 'hold' ? 'No correction is on hold' : 'No correction has been released yet') + '</p><p class="rk-state-d">Corrections reach you after the Academic Reviewer approves them.</p></div>';
    else h += '<div class="rk-tablewrap"><table class="rk-table"><caption>Corrections, ' + esc(tabs.find(t => t[0] === tab)[1]) + '</caption><thead><tr><th scope="col" class="rk-c-inst">Experiment</th><th scope="col" class="rk-c-exp">What changes</th><th scope="col" class="rk-c-type">Approved by</th><th scope="col" class="rk-c-date">Approved</th><th scope="col" class="rk-c-st">Status</th></tr></thead><tbody>' +
      list.map(u => '<tr data-href="#/content/updates/' + u.id + '"><td class="rk-c-inst"><a class="rk-rowlink" href="#/content/updates/' + u.id + '" aria-label="' + esc(u.name + ' correction, version ' + u.from + ' to ' + u.to + ', ' + UPD_LBL[u.st] + '. Open') + '">' + esc(u.name) + '</a><span class="rk-small">' + SA.code(u.course) + '</span></td><td class="rk-c-exp"><span class="rk-strong">Version ' + esc(u.from) + ' → ' + esc(u.to) + '</span><span class="rk-small">' + esc(u.st === 'released' ? 'Released ' + (u.rel || '') : 'Version ' + u.from + ' stays live until released') + '</span></td><td class="rk-c-type"><span class="rk-strong">Academic Reviewer</span><span class="rk-small">' + esc(u.by) + '</span></td><td class="rk-c-date"><span class="rk-inlabel">Approved </span>' + esc(u.appr.split(',')[0]) + '</td><td class="rk-c-st">' + SA.pill(UPD_KIND[u.st], UPD_LBL[u.st]) + '</td></tr>').join('') + '</tbody></table></div>';
    return h + '<p class="rk-ca-foot">The only route for changing published content: Content Manager, then Academic Reviewer, then your release decision.</p></section>';
  };
  A.updTab = d => { SA.S.ui.updTab = d.k; SA.render(); SA.focus('seg-' + d.k); };

  /* ═══ SA-11 Release or hold an update ══════════════════════════════════════ */
  V.update = u => {
    const S = SA.S, c = SA.content(u.exp);
    if (u.notForSA) return SA.crumbs([['Content', '#/content/updates'], ['Updates', '#/content/updates'], [u.name]]) + V.message({ t: 'Nothing to decide', d: 'This correction hasn’t been approved by the Academic Reviewer yet. It reaches you when it is. The live version is unchanged.', act: '<a class="rb-btn rb-btn--primary" href="#/content/updates">Back to Updates</a>', inline: true });
    u.form = u.form || { choice: null, reason: '', errs: {} };
    const f = u.form, live = c ? c.ver : u.from;
    let h = SA.crumbs([['Content', '#/content/updates'], ['Updates', '#/content/updates'], [u.name]]) +
      '<div class="rk-head"><div class="rk-head-text"><p class="rb-eyebrow-date">' + esc(S.A.long) + '</p><p class="rk-eyebrow">Correction to a published experiment</p><h1 class="rk-title" id="page-h1" tabindex="-1">' + esc(u.name) + '</h1><div class="rk-meta">' + SA.pill(UPD_KIND[u.st], UPD_LBL[u.st], true) + '<span>Version ' + esc(u.from) + ' → ' + esc(u.to) + '</span><span class="rk-meta-sep" aria-hidden="true"></span><span>Approved by ' + esc(u.by) + ' on ' + esc(u.appr.split(',')[0]) + '</span></div></div><a class="rb-btn rk-goto" href="#up-panel" data-act="goUpPanel">Go to decision</a></div>';
    h += SA.flashHtml('upd-' + u.id);
    const facts = [['Live now', 'Version ' + live], [u.st === 'released' ? 'Released' : 'Proposed', 'Version ' + u.to], ['Course', u.course], ['Formats', c ? c.fmts.join(', ') : '']];
    h += '<div class="rk-detailwrap"><div class="rk-detail"><div class="rk-surface rk-mainsheet"><dl class="rk-factstrip">' + facts.map(x => '<div class="rk-fact"><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>').join('') + '</dl>';
    if (u.changes.length) h += '<section class="rk-sec" aria-labelledby="up-ch"><div class="rk-sec-h"><h2 class="rb-h2" id="up-ch">What changes</h2><p class="rk-note">Changed fields only</p></div><div class="sa-tablewrap"><table class="sa-table sa-table--rows sa-compare"><caption class="xr-sr">Changed fields, live and proposed</caption><thead><tr><th scope="col">Field</th><th scope="col">' + (u.st === 'released' ? 'Live before' : 'Live now · ' + esc(u.from)) + '</th><th scope="col">' + (u.st === 'released' ? 'Released · ' : 'Proposed · ') + esc(u.to) + '</th></tr></thead><tbody>' + u.changes.map(x => '<tr><th scope="row">' + esc(x[0]) + '</th><td data-label="' + (u.st === 'released' ? 'Live before' : 'Live now · ' + esc(u.from)) + '">' + esc(x[1]) + '</td><td class="sa-compare-new" data-label="' + (u.st === 'released' ? 'Released · ' : 'Proposed · ') + esc(u.to) + '">' + esc(x[2]) + '</td></tr>').join('') + '</tbody></table></div>' + (u.st === 'released' ? '<p class="rk-hint" style="margin-top:10px">“Live before” is the version that was live until the release.</p>' : '') + '</section>';
    else h += '<section class="rk-sec" aria-labelledby="up-ch"><div class="rk-sec-h"><h2 class="rb-h2" id="up-ch">What changes</h2></div><p class="rk-next">The changed fields for this correction aren’t part of this sample.</p></section>';
    if (u.why) h += '<section class="rk-sec" aria-labelledby="up-why"><div class="rk-sec-h"><h2 class="rb-h2" id="up-why">Why, from the Content Manager</h2></div><blockquote class="rk-quote"><p>' + esc(u.why) + '</p><p class="rk-quote-by">' + esc(u.cm) + ', Content Manager</p></blockquote></section>';
    h += '<section class="rk-sec" aria-labelledby="up-rev"><div class="rk-sec-h"><h2 class="rb-h2" id="up-rev">Academic review</h2></div><p class="rk-next">Approved by ' + esc(u.by) + ' on ' + esc(u.appr) + '. The full review history is below.</p></section>';
    const using = [];
    S.insts.forEach(i => { i.plans.forEach(p => p.exps.forEach(e => { if (e[0] === u.name) using.push([i.name, 'In its access plan · ' + e[2].join(', '), SA.INST_LBL[SA.instStatus(i)]]); })); if (!i.plans.length && i.requested) i.requested.forEach(e => { if (e[0] === u.name) using.push([i.name, 'Requested · ' + e[2].join(', '), 'Approved — payment required; not using it yet']); }); });
    h += '<section class="rk-sec" aria-labelledby="up-use"><div class="rk-sec-h"><h2 class="rb-h2" id="up-use">Institutions using it</h2><p class="rk-note">From the access plans in this sample</p></div>' + (using.length ? '<div class="sa-tablewrap"><table class="sa-table sa-table--rows"><caption class="xr-sr">Institutions using this experiment</caption><thead><tr><th scope="col">Institution</th><th scope="col">Access</th><th scope="col">Status</th></tr></thead><tbody>' + using.map(x => '<tr><th scope="row">' + esc(x[0]) + '</th><td data-label="Access">' + esc(x[1]) + '</td><td data-label="Status">' + esc(x[2]) + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="rk-next">No institution has it in an access plan.</p>') + '<p class="rk-hint" style="margin-top:10px">Release changes the experiment for everyone at once. Nothing here changes any institution’s access.</p></section>';
    h += '<section class="rk-sec" aria-labelledby="up-hist"><div class="rk-sec-h"><h2 class="rb-h2" id="up-hist">History</h2><p class="rk-note">Newest first · kept after every decision</p></div>' + SA.timeline(u.hist) + '</section></div>';
    h += '<aside class="rk-aside" id="up-panel" aria-labelledby="up-panel-h"><div class="rk-panel"><div class="rk-panel-head"><h2 id="up-panel-h" tabindex="-1">Your decision</h2></div><div class="rk-panel-body">' + SA.refusalHtml('upd-' + u.id);
    if (u.st === 'awaiting') {
      const errs = Object.keys(f.errs);
      if (errs.length) h += '<div class="rk-errsum" id="up-errs" tabindex="-1" role="alert"><p class="rk-errsum-t">Check your decision</p><ul>' + errs.map(e => '<li><a href="#' + (e === 'choice' ? 'up-c0' : 'up-reason') + '" data-act="focusField" data-id="' + (e === 'choice' ? 'up-c0' : 'up-reason') + '">' + esc(f.errs[e]) + '</a></li>').join('') + '</ul></div>';
      h += '<fieldset class="rk-fieldset' + (f.errs.choice ? ' is-invalid' : '') + '"><legend>Decision</legend><div class="rk-choices">' + [['release', 'Release update', 'Version ' + u.to + ' goes live for everyone.'], ['hold', 'Hold', 'Version ' + live + ' stays live. You can lift the hold later.']].map((o, i) => '<label class="rk-choice" for="up-c' + i + '"><input type="radio" name="up-choice" id="up-c' + i + '" value="' + o[0] + '" data-bind="upd:' + u.id + '.form.choice"' + (f.choice === o[0] ? ' checked' : '') + '><span class="rk-choice-t">' + o[1] + '</span><span class="rk-choice-d">' + esc(o[2]) + '</span></label>').join('') + '</div>' + (f.errs.choice ? '<p class="rk-ferr">' + SA.ico('rki-alert', '') + esc(f.errs.choice) + '</p>' : '') + '</fieldset>';
      if (f.choice === 'hold') h += '<div class="rk-field"><label class="rk-label" for="up-reason">Reason for the hold (required)</label><p class="rk-hint" id="up-reason-hint">The Content Manager sees this reason.</p><textarea id="up-reason" class="rk-textarea" data-bind="upd:' + u.id + '.form.reason" data-live="1"' + (f.errs.reason ? ' aria-invalid="true"' : '') + ' aria-describedby="up-reason-hint up-reason-err">' + esc(f.reason) + '</textarea>' + (f.errs.reason ? '<p class="rk-ferr" id="up-reason-err">' + SA.ico('rki-alert', '') + esc(f.errs.reason) + '</p>' : '') + '</div>';
      if (f.choice === 'hold' && !SA.T(f.reason)) h += '<p class="rk-pending">' + SA.ico('rki-clock', '') + 'Add the reason before holding.</p>';
      h += '<button type="button" class="rb-btn rb-btn--primary rk-go" id="up-go" data-act="updGo" data-id="' + u.id + '">' + (f.choice === 'hold' ? 'Hold update' : 'Release update') + '</button><p class="rk-hint">Releasing never grants or changes an institution’s access.</p>';
    } else if (u.st === 'hold') {
      h += '<div class="rk-done" id="up-done" tabindex="-1"><p>' + SA.pill('paused', 'On hold', true) + '</p><p class="rk-done-meta">Put on hold on ' + esc(u.hold.when) + ' by Arjun Mehta</p>' + (u.hold.reason ? '<blockquote class="rk-quote"><p>' + esc(u.hold.reason) + '</p></blockquote>' : '') +
        '<div class="rk-notice rk-notice--paused" role="status">' + SA.ico('rki-lock', '') + '<p class="rk-notice-t">Release isn’t available while the update is on hold</p><p class="rk-notice-d">Lift the hold first. It goes back to waiting for your decision; nothing goes live by itself.</p></div>' +
        '<button type="button" class="rb-btn rb-btn--primary rk-go" id="up-lift" data-act="updLift" data-id="' + u.id + '">Lift hold</button><p class="rk-hint">What else a hold affects, and whether it blocks later corrections, is still open.</p></div>';
    } else {
      h += '<div class="rk-done" id="up-done" tabindex="-1"><p>' + SA.pill('ok', 'Released', true) + '</p><p class="rk-done-meta">Released on ' + esc(u.rel) + ' by Arjun Mehta</p><dl class="rk-stand"><div><dt>Live now</dt><dd>Version ' + esc(u.to) + '</dd></div><div><dt>Live before</dt><dd>Version ' + esc(u.from) + '</dd></div><div><dt>Institutional access</dt><dd>Unchanged</dd></div></dl><p class="rk-next">This decision is recorded and read-only.</p><a class="rb-btn" href="#/content/updates">Back to Updates</a></div>';
    }
    return h + '</div></div></aside></div></div>';
  };
  A.goUpPanel = () => { const el = document.getElementById('up-panel'); if (el) el.scrollIntoView({ block: 'start' }); SA.focus('up-panel-h'); };
  A.updGo = d => {
    const u = SA.upd(d.id), f = u.form, e = {};
    if (!f.choice) e.choice = 'Choose a decision';
    if (f.choice === 'hold' && !SA.T(f.reason)) e.reason = 'Add a reason — it is kept in the history';
    if (Object.keys(e).length) { f.errs = e; SA.render(); SA.focus('up-errs'); return; }
    f.errs = {};
    SA.openDlg({ type: f.choice === 'hold' ? 'holdUpd' : 'releaseUpd', id: u.id, opener: 'up-go' }, 'dlg-ok');
  };
  A.updLift = d => SA.openDlg({ type: 'liftUpd', id: d.id, opener: 'up-lift' }, 'dlg-ok');
  SA.DLG.releaseUpd = dl => { const u = SA.upd(dl.id), c = SA.content(u.exp);
    return { title: 'Release version ' + u.to + ' of ' + u.name + '?', desc: 'Releasing replaces the live version for everyone at once.', ok: 'Release update', busyLabel: 'Releasing…',
      body: SA.dlgList(['Version ' + u.to + ' goes live for everyone: the public catalogue and every institution using it.', 'Version ' + u.from + ' is kept in the history as Live before.'], ['No institution’s or student’s access changes.']),
      run: () => { if (SA.staleGuard('upd-' + u.id)) return; SA.busyThen(() => { const when = SA.now(); u.st = 'released'; u.rel = when; u.hist.unshift(['Released by Arjun Mehta', when, 'Version ' + u.to + ' is live for everyone. Version ' + u.from + ' is kept as Live before.']);
        if (c) { c.ver = u.to; c.since = SA.S.A.short; c.hist.unshift(['Version ' + u.to + ' released', SA.S.A.short, 'Released by Arjun Mehta. Version ' + u.from + ' is kept as Live before.']); }
        SA.S.dlg = null; SA.setFlash('upd-' + u.id, 'Version ' + u.to + ' is live.', 'Everyone now sees the corrected experiment. No access changed.'); SA.render(); SA.focus('sa-flash'); }); } }; };
  SA.DLG.holdUpd = dl => { const u = SA.upd(dl.id);
    return { title: 'Hold the ' + u.name + ' correction?', desc: 'Version ' + u.from + ' stays live. The Content Manager sees your reason.', ok: 'Hold update', busyLabel: 'Holding…',
      body: '<blockquote class="rk-quote"><p>' + esc(u.form.reason) + '</p><p class="rk-quote-by">Your reason</p></blockquote>',
      run: () => { if (SA.staleGuard('upd-' + u.id)) return; SA.busyThen(() => { const when = SA.now(); u.st = 'hold'; u.hold = { when, reason: SA.T(u.form.reason) }; u.hist.unshift(['Put on hold by Arjun Mehta', when, '“' + SA.T(u.form.reason) + '” Version ' + u.from + ' stays live.']); u.form = { choice: null, reason: '', errs: {} };
        SA.S.dlg = null; SA.setFlash('upd-' + u.id, 'The correction is on hold.', 'Version ' + u.from + ' stays live.'); SA.render(); SA.focus('sa-flash'); }); } }; };
  SA.DLG.liftUpd = dl => { const u = SA.upd(dl.id);
    return { title: 'Lift the hold on the ' + u.name + ' correction?', desc: 'It goes back to waiting for your decision. Nothing goes live.', ok: 'Lift hold', busyLabel: 'Lifting…', body: '',
      run: () => { if (SA.staleGuard('upd-' + u.id)) return; SA.busyThen(() => { const when = SA.now(); u.st = 'awaiting'; u.hist.unshift(['Hold lifted by Arjun Mehta', when, 'Back to waiting for your decision. Nothing went live.']);
        SA.S.dlg = null; SA.setFlash('upd-' + u.id, 'Hold lifted.', 'The correction is waiting for your decision again. Nothing went live.'); SA.render(); SA.focus('sa-flash'); }); } }; };

  /* ═══ SA-12 All content ════════════════════════════════════════════════════ */
  const CF = [['all', 'All statuses'], ['published', 'Published'], ['review', 'With the Academic Reviewer'], ['cm', 'With the Content Manager'], ['vendor', 'Returned to the vendor'], ['stuck', 'Stuck — nobody can act']];
  const where = c => { const s = SA.contentStatus(c); return s === 'published' ? 'Published · version ' + c.ver + ' · live since ' + c.since : s === 'stuck' ? c.where : c.where; };
  const updTag = c => { const u = c.updId && SA.upd(c.updId); if (!u || u.notForSA || u.st === 'released') return ''; return u.st === 'awaiting' ? 'Correction waiting for your release decision' : 'Correction on hold'; };
  V.allContent = () => {
    const S = SA.S, L = S.ui.contList, mode = SA.listMode(), q = SA.T(L.q).toLowerCase();
    const list = S.content.filter(c => (L.f === 'all' || SA.contentStatus(c) === L.f) && (!q || (c.name + ' ' + c.course).toLowerCase().indexOf(q) >= 0));
    const waiting = S.updates.filter(u => u.st === 'awaiting');
    let h = contentHead('Where every experiment and submission is in the workflow, and who can act on it.') + contentTabs('all');
    if (waiting.length) h += SA.notice('info', 'rbi-edit', waiting.length === 1 ? 'A correction is waiting for your release decision' : waiting.length + ' corrections are waiting for your release decision', esc(waiting.map(u => u.name + ' ' + u.from + ' → ' + u.to).join(' · ')) + '.', '<a class="rb-btn" href="#/content/updates">Open Updates</a>');
    const chips = []; if (q) chips.push(['q', 'Search: “' + SA.T(L.q) + '”']); if (L.f !== 'all') chips.push(['f', 'Status: ' + CF.find(x => x[0] === L.f)[1]]);
    h += '<section class="rk-surface" aria-label="Every experiment and submission">';
    if (mode !== 'empty') h += '<div class="rk-toolbar"><div class="rk-tools" role="search" aria-label="Filter content"><div class="rk-field rk-search"><label class="rk-label" for="ct-q">Search</label><div class="rk-inputwrap">' + SA.ico('rki-search', '') + '<input id="ct-q" class="rk-input" type="search" placeholder="Experiment or course code" autocomplete="off" value="' + esc(L.q) + '" data-bind="ui.contList.q" data-live="1"></div></div><div class="rk-field rk-field--st"><label class="rk-label" for="ct-st">Workflow status</label><div class="rk-selwrap"><select id="ct-st" class="rk-select" data-bind="ui.contList.f">' + CF.map(x => '<option value="' + x[0] + '"' + (x[0] === L.f ? ' selected' : '') + '>' + esc(x[1]) + ' (' + S.content.filter(c => x[0] === 'all' || SA.contentStatus(c) === x[0]).length + ')</option>').join('') + '</select>' + SA.ico('rki-chev', '') + '</div></div></div>' +
      ((mode === 'ok' || chips.length) ? '<div class="rk-statusline">' + (mode === 'ok' ? '<p class="rk-count" role="status">' + (chips.length ? list.length + ' of ' + SA.plural(S.content.length, 'record') : SA.plural(S.content.length, 'record')) + ' · read-only</p>' : '') + chips.map(c => '<span class="rk-chip">' + esc(c[1]) + '<button type="button" aria-label="Remove filter ' + esc(c[1]) + '" data-act="ctChip" data-k="' + c[0] + '">' + SA.ico('rki-x', '') + '</button></span>').join('') + (chips.length ? '<button type="button" class="rk-clear" data-act="ctClear">Clear filters</button>' : '') + '</div>' : '') + '</div>';
    if (mode !== 'ok') h += SA.listState(mode, { loading: 'Loading content…', failed: 'We couldn’t load the content', emptyT: 'No content yet', emptyD: 'Experiments appear here once a vendor starts one.', emptyIco: 'rki-layers' });
    else if (!list.length) h += SA.listState('none', { noneT: 'No content matches', noneD: 'Try another name or course code.', clearAct: 'ctClear' });
    else h += '<div class="rk-tablewrap"><table class="rk-table"><caption>Experiments and submissions with their workflow status</caption><thead><tr><th scope="col" class="rk-c-inst">Experiment</th><th scope="col" class="rk-c-exp">Where it is</th><th scope="col" class="rk-c-type">Who can act</th><th scope="col" class="rk-c-date">Formats</th><th scope="col" class="rk-c-st">Status</th></tr></thead><tbody>' +
      list.map(c => { const s = SA.contentStatus(c), tag = updTag(c); return '<tr data-href="#/content/records/' + c.id + '"><td class="rk-c-inst"><a class="rk-rowlink" href="#/content/records/' + c.id + '" aria-label="' + esc(c.name + ', ' + SA.CONT_LBL[s] + '. Open the record') + '">' + esc(c.name) + '</a><span class="rk-small">' + SA.code(c.course) + '</span></td><td class="rk-c-exp"><span class="rk-strong">' + esc(where(c)) + '</span>' + (tag ? '<span class="rk-small">' + esc(tag) + '</span>' : '') + '</td><td class="rk-c-type"><span class="rk-small" style="margin:0">' + esc(SA.whoCanAct(c)) + '</span></td><td class="rk-c-date">' + SA.fmtBadges(c.fmts, 'Formats: ' + c.fmts.join(', ')) + '</td><td class="rk-c-st">' + SA.pill(SA.CONT_KIND[s], SA.CONT_LBL[s]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    return h + '<p class="rk-ca-foot">Published content is read-only. It changes only through a correction: Content Manager, then Academic Reviewer, then your release decision.</p></section>';
  };
  A.ctChip = d => { const L = SA.S.ui.contList; if (d.k === 'q') L.q = ''; else L.f = 'all'; SA.render(); SA.focus('ct-q'); };
  A.ctClear = () => { Object.assign(SA.S.ui.contList, { q: '', f: 'all' }); SA.render(); SA.focus('ct-q'); };

  /* ═══ SA-13 Content record ═════════════════════════════════════════════════ */
  V.record = c => {
    const S = SA.S, s = SA.contentStatus(c), u = c.updId && SA.upd(c.updId), stuck = s === 'stuck';
    let h = SA.crumbs([['Content', '#/content/updates'], ['All content', '#/content/all'], [c.name]]) +
      '<div class="rk-head"><div class="rk-head-text"><p class="rb-eyebrow-date">' + esc(S.A.long) + '</p><p class="rk-eyebrow">' + (c.sub && s !== 'published' ? 'Submission' : 'Experiment') + '</p><h1 class="rk-title" id="page-h1" tabindex="-1">' + esc(c.name) + '</h1><div class="rk-meta">' + SA.pill(SA.CONT_KIND[s], SA.CONT_LBL[s], true) + SA.code(c.course) + '<span>' + esc(SA.courseName(c.course)) + '</span></div></div>' + (stuck ? '<a class="rb-btn rk-goto" href="#rc-panel" data-act="goRcPanel">Go to override</a>' : '') + '</div>';
    h += SA.flashHtml('rec-' + c.id);
    if (stuck) h += SA.notice('warn', 'rbi-hourglass', 'Stuck — nobody can act', 'No Academic Reviewer has ' + esc(c.course) + ' in scope, so this review can’t continue. Giving an Academic Reviewer ' + esc(c.course) + ' in Platform roles lets the review continue. Use the override only when that isn’t possible.', '<a class="rb-btn" href="#/roles/reviewers">Open Platform roles</a>');
    else if (s === 'published') h += SA.notice('info', 'rki-lock', 'Published · read-only', 'Published content changes only through a correction: Content Manager, then Academic Reviewer, then your release decision.', u && !u.notForSA && u.st !== 'released' ? '<a class="rb-btn" href="#/content/updates/' + u.id + '">' + (u.st === 'awaiting' ? 'Open the release decision' : 'Open the held correction') + '</a>' : '');
    else h += SA.notice('ok', 'rki-ok', 'In the workflow', esc(SA.whoCanAct(c)) + ' can act on it. Nothing is needed from you.');
    const dl = [['Summary', esc(c.summary)], ['Formats', SA.fmtBadges(c.fmts)], ['Live version', s === 'published' ? 'Version ' + esc(c.ver) + ', live since ' + esc(c.since) : 'Not published'], ['Vendor', esc(c.venWho || c.ven || 'Not recorded in this sample')], ['Who can act', esc(SA.whoCanAct(c))]];
    h += '<div class="rk-detailwrap"><div class="' + (stuck ? 'rk-detail' : 'sa-single') + '"><div class="rk-surface rk-mainsheet"><section class="rk-sec" aria-labelledby="rc-cat"><div class="rk-sec-h"><h2 class="rb-h2" id="rc-cat">Catalogue details</h2><p class="rk-note">Read-only</p></div><dl class="rk-dl">' + dl.map(x => '<dt>' + x[0] + '</dt><dd>' + x[1] + '</dd>').join('') + '</dl></section>' +
      (c.outcomes.length ? '<section class="rk-sec" aria-labelledby="rc-lo"><div class="rk-sec-h"><h2 class="rb-h2" id="rc-lo">Learning outcomes</h2></div><ul class="sa-bullets">' + c.outcomes.map(o => '<li>' + esc(o) + '</li>').join('') + '</ul></section>' : '') +
      '<section class="rk-sec" aria-labelledby="rc-hist"><div class="rk-sec-h"><h2 class="rb-h2" id="rc-hist">Governance history</h2><p class="rk-note">Newest first</p></div>' + SA.timeline(c.hist) + '</section></div>';
    if (stuck) {
      h += '<aside class="rk-aside" id="rc-panel" aria-labelledby="rc-panel-h"><div class="rk-panel"><div class="rk-panel-head"><h2 id="rc-panel-h" tabindex="-1">Move status (override)</h2></div><div class="rk-panel-body">' + SA.refusalHtml('rec-' + c.id) +
        '<dl class="rk-stand"><div><dt>From</dt><dd>With the Academic Reviewer</dd></div><div><dt>To</dt><dd>Returned to the vendor</dd></div></dl><p class="rk-hint">Returning it to the vendor is the one supported move for a stuck record. Published is never offered; only the Content Manager publishes.</p>' +
        SA.field({ id: 'rc-reason', label: 'Reason (required)', hint: 'Recorded with your name. The vendor sees it with the returned submission.', bind: 'inline.reason', value: S.inline ? S.inline.reason : '', textarea: true, err: S.inline ? S.inline.err : '' }) +
        '<button type="button" class="rb-btn rb-btn--primary rk-go" id="rc-go" data-act="ovrGo" data-id="' + c.id + '">Move status</button></div></div></aside>';
    }
    return h + '</div></div>';
  };
  A.goRcPanel = () => { const el = document.getElementById('rc-panel'); if (el) el.scrollIntoView({ block: 'start' }); SA.focus('rc-panel-h'); };
  A.ovrGo = d => {
    const S = SA.S; if (!S.inline) S.inline = { reason: '' }; S.inline.type = 'ovr';
    if (!SA.T(S.inline.reason)) { S.inline.err = 'Add a reason — it is kept in the history'; SA.render(); SA.focus('rc-reason'); return; }
    S.inline.err = ''; SA.openDlg({ type: 'override', id: d.id, opener: 'rc-go' }, 'dlg-ok');
  };
  SA.DLG.override = dl => { const c = SA.content(dl.id), r = SA.T(SA.S.inline && SA.S.inline.reason);
    return { title: 'Return ' + c.name + ' to the vendor?', desc: 'An override, recorded with your name and reason.', ok: 'Move status', busyLabel: 'Moving…',
      body: SA.dlgList(['Its status moves from “With the Academic Reviewer” to “Returned to the vendor”.', (c.venWho || c.ven) + ' can work on it again.'], ['Nothing is published. It goes through academic review again after the vendor resubmits.']) + '<blockquote class="rk-quote"><p>' + esc(r) + '</p><p class="rk-quote-by">Your reason</p></blockquote>',
      run: () => { if (SA.staleGuard('rec-' + c.id)) return; SA.busyThen(() => { const when = SA.now(); c.st = 'vendor'; c.where = 'Returned to the vendor on ' + SA.S.A.short + ' (override)'; c.who = (c.venWho || c.ven); c.hist.unshift(['Status moved by Arjun Mehta (override)', when, '“' + r + '” From “With the Academic Reviewer” to “Returned to the vendor”.']);
        SA.S.inline = null; SA.S.dlg = null; SA.setFlash('rec-' + c.id, 'Returned to the vendor.', 'The override and your reason are in the governance history.'); SA.render(); SA.focus('sa-flash'); }); } }; };

  /* ═══ SA-14 Academic structure ═════════════════════════════════════════════ */
  const expsOf = code => SA.S.content.filter(c => c.course === code && c.st === 'published');
  V.structure = () => {
    const S = SA.S, mode = SA.listMode();
    let h = '<div class="rk-head"><div class="rk-head-text"><p class="rb-eyebrow-date">' + esc(S.A.long) + '</p><h1 class="rb-h1" id="page-h1" tabindex="-1">Academic structure</h1><p class="rk-sub">Engineering areas and the courses in them. Platform course codes are maintained by the Content Manager and shown read-only here.</p></div><div class="rk-head-act"><button type="button" class="rb-btn" id="st-add-area" data-act="addArea">' + SA.ico('rki-plus', '') + 'Add area</button><button type="button" class="rb-btn rb-btn--navy" id="st-add-course" data-act="addCourse">' + SA.ico('rki-plus', '') + 'Add course</button></div></div>';
    h += SA.flashHtml('structure');
    h += '<section class="rk-surface" aria-label="Engineering areas and courses">';
    if (mode !== 'ok') h += SA.listState(mode === 'empty' ? 'empty' : mode, { loading: 'Loading the academic structure…', failed: 'We couldn’t load the academic structure', emptyT: 'No engineering areas yet', emptyD: 'Add an area, then add its courses.', emptyIco: 'rki-layers' });
    else h += S.areas.map(a => {
      const cs = S.courses.filter(c => c.area === a.id);
      return '<section class="rk-course" aria-labelledby="ar-' + a.id + '"><div class="rk-course-h"><div class="rk-course-id"><h2 class="rk-course-t" id="ar-' + a.id + '">' + esc(a.name) + '</h2><p class="rk-course-codes">' + esc(a.desc || 'No description yet.') + '</p></div><a class="rb-link" href="#/structure/areas/' + a.id + '" aria-label="Open the area ' + esc(a.name) + '">Open area</a></div>' +
        (cs.length ? '<ul class="sa-list">' + cs.map(c => { const n = expsOf(c.code).length; return '<li><a class="sa-list-row" href="#/structure/courses/' + c.id + '"><span class="sa-list-main"><span class="sa-list-t">' + esc(c.name) + '</span><span class="sa-list-d">' + (c.code ? SA.code(c.code) : '<span class="rk-tag-warn">No platform code yet</span>') + '<span>' + esc(SA.plural(n, 'published experiment')) + '</span></span></span><span class="sa-list-go" aria-hidden="true">' + SA.ico('rki-right', '') + '</span></a></li>'; }).join('') + '</ul>' : '<p class="rk-next">No courses yet. Add one to start using this area.</p>') + '</section>';
    }).join('');
    return h + '<p class="rk-ca-foot">Areas group courses; there is no module layer. Retiring an area or course is not available.</p></section>';
  };
  A.addArea = () => SA.openDlg({ type: 'area', mode: 'add', name: '', desc: '', opener: 'st-add-area' }, 'dlg-a-n');
  A.addCourse = d => SA.openDlg({ type: 'course', mode: 'add', name: '', area: (d && d.area) || '', desc: '', opener: (d && d.opener) || 'st-add-course' }, 'dlg-c-n');
  SA.DLG.area = dl => {
    const S = SA.S, a = dl.id && S.areas.find(x => x.id === dl.id), add = dl.mode === 'add', rename = dl.mode === 'rename';
    return { title: add ? 'Add an engineering area' : rename ? 'Rename ' + a.name : 'Edit the description of ' + a.name, desc: add ? 'It appears in the public area explorer and the catalogue once it has courses. No artwork is added here.' : rename ? 'The new name shows in the public explorer and catalogue, vendor course lists and student-import matching.' : 'The description shows in the public area explorer.', ok: add ? 'Add area' : rename ? 'Save name' : 'Save description', busyLabel: add ? 'Adding…' : 'Saving…',
      body: (add || rename ? SA.field({ id: 'dlg-a-n', label: 'Area name', bind: 'dlg.name', value: dl.name, err: dl.errs.n }) : '') + (add || !rename ? SA.field({ id: 'dlg-a-d', label: 'Description' + (add ? ' (optional)' : ''), bind: 'dlg.desc', value: dl.desc, textarea: true }) : ''),
      run: () => {
        const n = SA.T(dl.name), e = {};
        if (add || rename) { if (!n) e.n = 'Enter the area name'; else if (rename && n === a.name) e.n = 'Enter a different name — this is the current one'; else if (S.areas.some(x => x.name.toLowerCase() === n.toLowerCase() && x !== a)) e.n = 'Another area already has this name'; }
        if (Object.keys(e).length) { dl.errs = e; SA.render(); SA.focus('dlg-a-n'); return; }
        SA.busyThen(() => { const when = SA.now();
          if (add) { const id = n.toLowerCase().replace(/[^a-z0-9]+/g, '-'); S.areas.push({ id, name: n, desc: SA.T(dl.desc), hist: [['Area added by Arjun Mehta', when, '']] }); S.dlg = null; SA.setFlash('structure', n + ' was added.', 'Add courses to it to start using it.', '#/structure'); SA.render(); SA.focus('sa-flash'); return; }
          if (rename) { a.hist.unshift(['Renamed by Arjun Mehta', when, '“' + a.name + '” → “' + n + '”']); a.name = n; } else { a.desc = SA.T(dl.desc); a.hist.unshift(['Description edited by Arjun Mehta', when, '']); }
          S.dlg = null; SA.setFlash('area-' + a.id, rename ? 'The area is now called ' + n + '.' : 'Description saved.', ''); SA.render(); SA.focus('sa-flash'); });
      } };
  };
  SA.DLG.course = dl => {
    const S = SA.S, c = dl.id && S.courses.find(x => x.id === dl.id), add = dl.mode === 'add', mode = dl.mode;
    const areaOpts = [['', 'Choose an area']].concat(S.areas.map(a => [a.id, a.name]));
    let body = '', title, desc, ok;
    if (add) { title = 'Add a course'; desc = 'The platform course code is added by the Content Manager in Course codes.'; ok = 'Add course'; body = SA.field({ id: 'dlg-c-n', label: 'Course name', bind: 'dlg.name', value: dl.name, err: dl.errs.n }) + SA.field({ id: 'dlg-c-a', label: 'Engineering area', bind: 'dlg.area', value: dl.area, select: areaOpts, err: dl.errs.a }) + SA.field({ id: 'dlg-c-d', label: 'Description (optional)', bind: 'dlg.desc', value: dl.desc, textarea: true }); }
    else if (mode === 'rename') { title = 'Rename ' + c.name; desc = 'The new name shows in the public catalogue, vendor course lists and student-import matching. The platform course code doesn’t change.'; ok = 'Save name'; body = SA.field({ id: 'dlg-c-n', label: 'Course name', bind: 'dlg.name', value: dl.name, err: dl.errs.n }); }
    else if (mode === 'desc') { title = 'Edit the description of ' + c.name; desc = 'The description shows in the public catalogue.'; ok = 'Save description'; body = SA.field({ id: 'dlg-c-d', label: 'Description', bind: 'dlg.desc', value: dl.desc, textarea: true }); }
    else { title = 'Move ' + c.name + ' to another area?'; desc = 'Its published experiments and any access plans that use it move with it. Nobody is filed against it.'; ok = 'Move course'; body = SA.field({ id: 'dlg-c-a', label: 'Move to', bind: 'dlg.area', value: dl.area, select: [['', 'Choose an area']].concat(S.areas.filter(a => a.id !== c.area).map(a => [a.id, a.name])), err: dl.errs.a }); }
    return { title, desc, ok, busyLabel: add ? 'Adding…' : mode === 'move' ? 'Moving…' : 'Saving…', body,
      run: () => {
        const n = SA.T(dl.name), e = {};
        if (add || mode === 'rename') { if (!n) e.n = 'Enter the course name'; else if (mode === 'rename' && n === c.name) e.n = 'Enter a different name — this is the current one'; else if (S.courses.some(x => x.name.toLowerCase() === n.toLowerCase() && x !== c)) e.n = 'Another course already has this name'; }
        if ((add || mode === 'move') && !dl.area) e.a = add ? 'Choose the engineering area it belongs to' : 'Choose the area to move it to';
        if (Object.keys(e).length) { dl.errs = e; SA.render(); SA.focus(e.n ? 'dlg-c-n' : 'dlg-c-a'); return; }
        SA.busyThen(() => { const when = SA.now();
          if (add) { const id = n.toLowerCase().replace(/[^a-z0-9]+/g, '-'); const an = S.areas.find(a => a.id === dl.area).name; S.courses.push({ id, code: '', name: n, area: dl.area, desc: SA.T(dl.desc), people: { students: 0, faculty: [] }, hist: [['Course added by Arjun Mehta', when, an + ' · no platform code yet.']] }); S.dlg = null; SA.go('#/structure/courses/' + id); SA.setFlash('course-' + id, n + ' was added.', 'The Content Manager adds its platform course code.', '#/structure/courses/' + id); SA.render(); return; }
          if (mode === 'rename') { c.hist.unshift(['Renamed by Arjun Mehta', when, '“' + c.name + '” → “' + n + '”']); c.name = n; }
          else if (mode === 'desc') { c.desc = SA.T(dl.desc); c.hist.unshift(['Description edited by Arjun Mehta', when, '']); }
          else { const from = S.areas.find(a => a.id === c.area).name, to = S.areas.find(a => a.id === dl.area).name; c.area = dl.area; c.hist.unshift(['Moved by Arjun Mehta', when, from + ' → ' + to]); }
          S.dlg = null; SA.setFlash('course-' + c.id, mode === 'rename' ? 'The course is now called ' + n + '.' : mode === 'desc' ? 'Description saved.' : 'The course moved to ' + S.areas.find(a => a.id === c.area).name + '.', ''); SA.render(); SA.focus('sa-flash'); });
      } };
  };

  /* ═══ SA-15 Area / course record ═══════════════════════════════════════════ */
  V.area = a => {
    const S = SA.S, cs = S.courses.filter(c => c.area === a.id);
    let h = SA.crumbs([['Academic structure', '#/structure'], [a.name]]) + '<div class="rk-head"><div class="rk-head-text"><p class="rb-eyebrow-date">' + esc(S.A.long) + '</p><p class="rk-eyebrow">Engineering area</p><h1 class="rk-title" id="page-h1" tabindex="-1">' + esc(a.name) + '</h1><p class="rk-sub">' + esc(a.desc || 'No description yet.') + '</p></div><div class="rk-head-act"><button type="button" class="rb-btn" id="ar-rename" data-act="areaRename" data-id="' + a.id + '">Rename</button><button type="button" class="rb-btn" id="ar-desc" data-act="areaDesc" data-id="' + a.id + '">Edit description</button></div></div>';
    h += SA.flashHtml('area-' + a.id);
    h += '<div class="rk-surface"><section class="rk-sec" aria-labelledby="ar-cs"><div class="rk-sec-h"><h2 class="rb-h2" id="ar-cs">Courses</h2><button type="button" class="rb-btn rb-btn--ghost" id="ar-addc" data-act="addCourse" data-area="' + a.id + '" data-opener="ar-addc">' + SA.ico('rki-plus', '') + 'Add course</button></div>' + (cs.length ? '<ul class="sa-list">' + cs.map(c => '<li><a class="sa-list-row" href="#/structure/courses/' + c.id + '"><span class="sa-list-main"><span class="sa-list-t">' + esc(c.name) + '</span><span class="sa-list-d">' + (c.code ? SA.code(c.code) : '<span class="rk-tag-warn">No platform code yet</span>') + '</span></span><span class="sa-list-go" aria-hidden="true">' + SA.ico('rki-right', '') + '</span></a></li>').join('') + '</ul>' : '<p class="rk-next">No courses yet. Add one to start using this area.</p>') + '</section>' +
      '<section class="rk-sec" aria-labelledby="ar-h"><div class="rk-sec-h"><h2 class="rb-h2" id="ar-h">History</h2><p class="rk-note">Newest first</p></div>' + SA.timeline(a.hist) + '</section></div><p class="sa-footnote">Areas have no artwork set here, and can’t be retired.</p>';
    return h;
  };
  A.areaRename = d => { const a = SA.S.areas.find(x => x.id === d.id); SA.openDlg({ type: 'area', mode: 'rename', id: a.id, name: a.name, desc: a.desc, opener: 'ar-rename' }, 'dlg-a-n'); };
  A.areaDesc = d => { const a = SA.S.areas.find(x => x.id === d.id); SA.openDlg({ type: 'area', mode: 'desc', id: a.id, name: a.name, desc: a.desc, opener: 'ar-desc' }, 'dlg-a-d'); };
  V.course = c => {
    const S = SA.S, area = S.areas.find(a => a.id === c.area), exps = expsOf(c.code), people = c.people.students > 0 || c.people.faculty.length > 0;
    const insts = S.insts.filter(i => i.plans.some(p => p.exps.some(e => e[1] === c.code)) || (i.requested || []).some(e => e[1] === c.code));
    const vendors = S.holders.filter(h => h.tab === 'vendors' && h.scope.some(s => s.st === 'active' && s.kind === 'course' && s.v === c.code));
    let h = SA.crumbs([['Academic structure', '#/structure'], [area.name, '#/structure/areas/' + area.id], [c.name]]) + '<div class="rk-head"><div class="rk-head-text"><p class="rb-eyebrow-date">' + esc(S.A.long) + '</p><p class="rk-eyebrow">Course · ' + esc(area.name) + '</p><h1 class="rk-title" id="page-h1" tabindex="-1">' + esc(c.name) + '</h1><div class="rk-meta">' + (c.code ? SA.code(c.code) + '<span>Platform course code, maintained by the Content Manager</span>' : '<span class="rk-tag-warn">No platform code yet</span><span>The Content Manager adds it in Course codes</span>') + '</div></div><a class="rb-btn rk-goto" href="#co-panel" data-act="goCoPanel">Go to changes</a></div>';
    h += SA.flashHtml('course-' + c.id);
    h += '<div class="rk-detailwrap"><div class="rk-detail"><div class="rk-surface rk-mainsheet"><section class="rk-sec" aria-labelledby="co-d"><div class="rk-sec-h"><h2 class="rb-h2" id="co-d">Course</h2></div><dl class="rk-dl"><dt>Course</dt><dd>' + esc(c.name) + '</dd><dt>Engineering area</dt><dd><a href="#/structure/areas/' + area.id + '">' + esc(area.name) + '</a></dd><dt>Description</dt><dd>' + esc(c.desc || 'No description yet.') + '</dd><dt>Platform course code</dt><dd>' + (c.code ? SA.code(c.code) + ' <span class="rk-hint">Read-only here</span>' : 'No platform code yet') + '</dd></dl></section>' +
      '<section class="rk-sec" aria-labelledby="co-use"><div class="rk-sec-h"><h2 class="rb-h2" id="co-use">What uses this course</h2></div><dl class="rk-dl"><dt>Published experiments</dt><dd>' + (exps.length ? exps.map(e => '<a href="#/content/records/' + e.id + '">' + esc(e.name) + '</a>').join(', ') : 'None yet') + '</dd><dt>Institutions</dt><dd>' + (insts.length ? insts.map(i => '<a href="#/institutions/' + i.id + '">' + esc(i.name) + '</a>').join(', ') : 'None') + '</dd><dt>Vendors in scope</dt><dd>' + (vendors.length ? vendors.map(v => '<a href="#/roles/holder/' + v.id + '">' + esc(v.name) + '</a>').join(', ') : 'None') + '</dd><dt>People filed against it</dt><dd>' + esc(people ? c.people.note || (c.people.students + ' students') : 'Nobody') + '</dd></dl></section>' +
      '<section class="rk-sec" aria-labelledby="co-h"><div class="rk-sec-h"><h2 class="rb-h2" id="co-h">History</h2><p class="rk-note">Newest first</p></div>' + SA.timeline(c.hist) + '</section></div>';
    h += '<aside class="rk-aside" id="co-panel" aria-labelledby="co-panel-h"><div class="rk-panel"><div class="rk-panel-head"><h2 id="co-panel-h" tabindex="-1">Change this course</h2></div><div class="rk-panel-body"><div class="sa-act"><button type="button" class="rb-btn" id="co-rename" data-act="coRename" data-id="' + c.id + '">Rename</button><button type="button" class="rb-btn" id="co-desc" data-act="coDesc" data-id="' + c.id + '">Edit description</button></div>' +
      '<div class="sa-act"><p class="sa-act-k">Move to another area</p>' + (people ? '<div class="rk-notice rk-notice--off" role="status">' + SA.ico('rki-lock', '') + '<p class="rk-notice-t">This course can’t be moved</p><p class="rk-notice-d">People are filed against it: ' + esc(c.people.note) + '. Nothing moves.</p></div>' : '<p class="rk-hint">Nobody is filed against it. Its experiments and the access plans that use it move with it.</p><button type="button" class="rb-btn" id="co-move" data-act="coMove" data-id="' + c.id + '">Move to another area</button>') + '</div>' +
      '<p class="rk-hint">The platform course code is maintained by the Content Manager. Retiring a course is not available.</p></div></div></aside></div></div>';
    return h;
  };
  A.goCoPanel = () => { const el = document.getElementById('co-panel'); if (el) el.scrollIntoView({ block: 'start' }); SA.focus('co-panel-h'); };
  A.coRename = d => { const c = SA.S.courses.find(x => x.id === d.id); SA.openDlg({ type: 'course', mode: 'rename', id: c.id, name: c.name, opener: 'co-rename' }, 'dlg-c-n'); };
  A.coDesc = d => { const c = SA.S.courses.find(x => x.id === d.id); SA.openDlg({ type: 'course', mode: 'desc', id: c.id, desc: c.desc, opener: 'co-desc' }, 'dlg-c-d'); };
  A.coMove = d => SA.openDlg({ type: 'course', mode: 'move', id: d.id, area: '', opener: 'co-move' }, 'dlg-c-a');
})();
