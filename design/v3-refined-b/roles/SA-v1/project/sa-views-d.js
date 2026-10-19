/* Super Admin · SA-16 Platform roles, SA-17 Role holder, SA-18…SA-22 Operations,
   plus the borrowed shared surfaces (XS): Help & support, signed-out page, message/refusal page. */
(function () {
  const SA = window.SA, D = SA.D, esc = SA.esc, V = SA.V, A = SA.A;
  const TABS = [['vendors', 'Vendors', 'Vendor', 'Register a Vendor'], ['reviewers', 'Reviewers', 'Academic Reviewer', 'Register a Reviewer'], ['content-managers', 'Content Managers', 'Content Manager', 'Register a Content Manager']];
  const EFF = { vendors: ['Can create experiments and submit them for: ', 'Can’t create or submit experiments yet. Nothing is in scope.'], reviewers: ['Sees submissions and updates for these in the review queue: ', 'Their review queue is empty. Nothing is in scope, and submissions for courses nobody reviews get stuck.'], 'content-managers': ['Decides publication and raises corrections for: ', 'Can’t publish or correct anything yet. Nothing is in scope.'] };
  const scopeLabel = s => s.kind === 'all' ? 'All experiments' : s.kind === 'course' ? s.v + ' · ' + SA.courseName(s.v) : s.v;
  const scopeShort = s => s.kind === 'all' ? 'All experiments' : s.v;

  /* ═══ SA-16 Platform roles ═════════════════════════════════════════════════ */
  V.roles = tab => {
    const S = SA.S, T = TABS.find(t => t[0] === tab), mode = SA.listMode();
    const list = S.holders.filter(h => h.tab === tab), none = list.filter(h => !SA.hasScope(h));
    let h = '<div class="rk-head"><div class="rk-head-text"><p class="rb-eyebrow-date">' + esc(S.A.long) + '</p><h1 class="rb-h1" id="page-h1" tabindex="-1">Platform roles</h1><p class="rk-sub">Who can produce, review and publish content, and for what.</p></div><div class="rk-head-act"><button type="button" class="rb-btn rb-btn--navy" id="ro-reg" data-act="roReg" data-tab="' + tab + '">' + SA.ico('rki-plus', '') + esc(T[3]) + '</button></div></div>';
    h += '<nav class="rk-tabs sa-tabs" aria-label="Platform roles">' + TABS.map(t => '<a class="rk-tab" href="#/roles/' + t[0] + '"' + (t[0] === tab ? ' aria-current="page"' : '') + '>' + t[1] + ' <span class="sa-tabn">' + S.holders.filter(x => x.tab === t[0]).length + '</span></a>').join('') + '</nav>';
    h += SA.flashHtml('roles-' + tab);
    if (none.length && mode === 'ok') h += SA.notice('warn', 'rbi-userq', none.length === 1 ? none[0].name + ' has no scope yet' : none.length + ' role holders have no scope yet', esc(EFF[tab][1]), '<a class="rb-btn" href="#/roles/holder/' + none[0].id + '">Assign scope</a>');
    h += '<section class="rk-surface" aria-label="' + esc(T[1]) + '">';
    if (mode !== 'ok') h += SA.listState(mode, { loading: 'Loading role holders…', failed: 'We couldn’t load the role holders', emptyT: 'Nobody is registered in this role yet', emptyD: 'Register someone, then assign what they can act on.', emptyIco: 'rki-user' });
    else if (!list.length) h += SA.listState('empty', { emptyT: 'Nobody is registered in this role yet', emptyD: 'Register someone, then assign what they can act on.', emptyIco: 'rki-user' });
    else h += '<div class="rk-tablewrap"><table class="rk-table"><caption>' + esc(T[1]) + ' and what they can act on</caption><thead><tr><th scope="col" class="rk-c-inst">Role holder</th><th scope="col" class="rk-c-exp">Can act on</th><th scope="col" class="rk-c-type">Work e-mail</th><th scope="col" class="rk-c-date">Registered</th><th scope="col" class="rk-c-st">Scope</th></tr></thead><tbody>' +
      list.map(x => { const act = x.scope.filter(s => s.st === 'active'), wd = x.scope.filter(s => s.st === 'withdrawn'); return '<tr data-href="#/roles/holder/' + x.id + '"><td class="rk-c-inst"><a class="rk-rowlink" href="#/roles/holder/' + x.id + '" aria-label="' + esc(x.name + ', ' + T[2] + (act.length ? '' : ', no scope') + '. Open') + '">' + esc(x.name) + '</a><span class="rk-small">' + esc(x.org) + '</span></td><td class="rk-c-exp"><span class="rk-strong">' + (act.length ? act.map(s => s.kind === 'course' ? SA.code(s.v) : esc(scopeShort(s))).join(' ') : 'Nothing yet') + '</span>' + (wd.length ? '<span class="rk-small">' + SA.plural(wd.length, 'scope') + ' withdrawn</span>' : '') + '</td><td class="rk-c-type"><span class="rk-small" style="margin:0">' + esc(x.email) + '</span></td><td class="rk-c-date"><span class="rk-inlabel">Registered </span>' + esc(x.since) + '</td><td class="rk-c-st">' + (act.length ? SA.pill('ok', 'Has scope') : SA.pill('warn', 'No scope')) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    return h + '<p class="rk-ca-foot">Registering doesn’t send an invitation. How a registered person first signs in is still open.</p></section>';
  };
  A.roReg = d => SA.openDlg({ type: 'register', tab: d.tab, name: '', email: '', org: '', opener: 'ro-reg' }, 'dlg-r-n');
  SA.DLG.register = dl => {
    const T = TABS.find(t => t[0] === dl.tab);
    return { title: T[3], desc: 'Registering doesn’t send an invitation. You assign what they can act on next.', ok: 'Register', busyLabel: 'Registering…',
      body: SA.field({ id: 'dlg-r-n', label: 'Name', bind: 'dlg.name', value: dl.name, err: dl.errs.n }) + SA.field({ id: 'dlg-r-e', label: 'Work e-mail', bind: 'dlg.email', value: dl.email, type: 'email', err: dl.errs.e }) + SA.field({ id: 'dlg-r-o', label: 'Organisation', bind: 'dlg.org', value: dl.org, err: dl.errs.o }),
      run: () => {
        const S = SA.S, e = {}, n = SA.T(dl.name), m = SA.T(dl.email).toLowerCase(), o = SA.T(dl.org), taken = SA.allEmails()[m];
        if (!n) e.n = 'Enter the person’s name';
        if (!m) e.e = 'Enter a work e-mail address'; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)) e.e = 'Enter an e-mail address like name@organisation.example'; else if (taken) e.e = 'This e-mail already belongs to ' + taken + '’s sign-in. Registering it again would take over that sign-in, so it isn’t allowed.';
        if (!o) e.o = 'Enter the organisation';
        if (Object.keys(e).length) { dl.errs = e; SA.render(); SA.focus(e.n ? 'dlg-r-n' : e.e ? 'dlg-r-e' : 'dlg-r-o'); return; }
        SA.busyThen(() => { const when = SA.now(), id = n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + S.tix;
          S.holders.push({ id, tab: dl.tab, role: T[2], name: n, org: o, email: m, since: S.A.short, sinceIso: S.A.iso, scope: [], hist: [['Registered as ' + T[2], when, 'Arjun Mehta · no scope yet. Nothing was sent.']] });
          S.dlg = null; SA.setFlash('holder-' + id, n + ' is registered as ' + T[2] + '.', 'Assign what they can act on. Nothing was sent to them.', '#/roles/holder/' + id); SA.go('#/roles/holder/' + id, 'sa-flash'); });
      } };
  };

  /* ═══ SA-17 Role holder ════════════════════════════════════════════════════ */
  V.holder = x => {
    const S = SA.S, T = TABS.find(t => t[0] === x.tab), act = x.scope.filter(s => s.st === 'active'), wd = x.scope.filter(s => s.st === 'withdrawn');
    x.form = x.form || { kind: '', v: '', errs: {} };
    const f = x.form;
    let h = SA.crumbs([['Platform roles', '#/roles/' + x.tab], [T[1], '#/roles/' + x.tab], [x.name]]) + '<div class="rk-head"><div class="rk-head-text"><p class="rb-eyebrow-date">' + esc(S.A.long) + '</p><p class="rk-eyebrow">' + esc(x.role) + '</p><h1 class="rk-title" id="page-h1" tabindex="-1">' + esc(x.name) + '</h1><div class="rk-meta">' + (act.length ? SA.pill('ok', 'Has scope', true) : SA.pill('warn', 'No scope', true)) + '<span>' + esc(x.org) + '</span><span class="rk-meta-sep" aria-hidden="true"></span><span>Registered ' + esc(x.since) + '</span></div></div><a class="rb-btn rk-goto" href="#ho-panel" data-act="goHoPanel">Go to assign scope</a></div>';
    h += SA.flashHtml('holder-' + x.id);
    if (!act.length) h += SA.notice('warn', 'rbi-userq', 'No scope — can’t act on anything yet', 'Assign a scope so they can act: all experiments, a course, or one experiment.');
    h += '<div class="rk-detailwrap"><div class="rk-detail"><div class="rk-surface rk-mainsheet"><section class="rk-sec" aria-labelledby="ho-can"><div class="rk-sec-h"><h2 class="rb-h2" id="ho-can">Can act on</h2></div><p class="rk-next">' + esc(act.length ? EFF[x.tab][0] + act.map(scopeShort).join(', ') + '.' : EFF[x.tab][1]) + '</p>';
    if (act.length) h += '<ul class="sa-scopes">' + act.map(s => { const i = x.scope.indexOf(s), open = S.inline && S.inline.type === 'wd' && S.inline.i === i;
      return '<li><div class="sa-scope-row"><div><p class="sa-scope-t">' + (s.kind === 'course' ? SA.code(s.v) + ' ' : '') + esc(s.kind === 'course' ? SA.courseName(s.v) : scopeLabel(s)) + '</p><p class="rk-small">Assigned ' + esc(s.when) + '</p></div>' + (open ? '' : '<button type="button" class="rb-btn rb-btn--ghost" id="wd-btn-' + i + '" data-act="wdOpen" data-i="' + i + '" aria-label="Withdraw scope ' + esc(scopeLabel(s)) + '">Withdraw</button>') + '</div>' +
        (open ? '<div class="sa-inline">' + SA.field({ id: 'wd-r-' + i, label: 'Reason for withdrawing ' + scopeShort(s), hint: 'Kept with the scope in the history.', bind: 'inline.reason', value: S.inline.reason, textarea: true, err: S.inline.err }) + '<div class="sa-btnrow"><button type="button" class="rb-btn rb-btn--navy" data-act="wdSave" data-id="' + x.id + '" data-i="' + i + '">Withdraw scope</button><button type="button" class="rb-btn" data-act="wdCancel" data-i="' + i + '">Cancel</button></div></div>' : '') + '</li>'; }).join('') + '</ul>';
    h += '</section>';
    if (wd.length) h += '<section class="rk-sec" aria-labelledby="ho-wd"><div class="rk-sec-h"><h2 class="rb-h2" id="ho-wd">Withdrawn</h2></div><ul class="sa-scopes">' + wd.map(s => { const i = x.scope.indexOf(s); return '<li><div class="sa-scope-row"><div><p class="sa-scope-t">' + (s.kind === 'course' ? SA.code(s.v) + ' ' : '') + esc(s.kind === 'course' ? SA.courseName(s.v) : scopeLabel(s)) + '</p><p class="rk-small">Withdrawn ' + esc(s.when) + (s.reason ? ' · “' + esc(s.reason) + '”' : '') + '</p></div><button type="button" class="rb-btn" id="rs-btn-' + i + '" data-act="rsOpen" data-id="' + x.id + '" data-i="' + i + '" aria-label="Restore scope ' + esc(scopeLabel(s)) + '">Restore</button></div></li>'; }).join('') + '</ul></section>';
    h += '<section class="rk-sec" aria-labelledby="ho-who"><div class="rk-sec-h"><h2 class="rb-h2" id="ho-who">Role holder</h2></div><dl class="rk-dl"><dt>Role</dt><dd>' + esc(x.role) + '</dd><dt>Organisation</dt><dd>' + esc(x.org) + '</dd><dt>Work e-mail</dt><dd>' + esc(x.email) + '</dd><dt>Registered</dt><dd>' + esc(x.since) + '</dd></dl><p class="rk-hint" style="margin-top:12px">How they first sign in is still open. Nothing is sent from here.</p></section>' +
      '<section class="rk-sec" aria-labelledby="ho-h"><div class="rk-sec-h"><h2 class="rb-h2" id="ho-h">History</h2><p class="rk-note">Newest first</p></div>' + SA.timeline(x.hist) + '</section></div>';
    const errs = Object.keys(f.errs);
    const courseOpts = [['', 'Choose a course']].concat(SA.S.courses.filter(c => c.code).map(c => [c.code, c.code + ' · ' + c.name]));
    const expOpts = [['', 'Choose an experiment']].concat(SA.S.content.filter(c => c.st === 'published').map(c => [c.name, c.name + ' · ' + c.course]));
    h += '<aside class="rk-aside" id="ho-panel" aria-labelledby="ho-panel-h"><div class="rk-panel"><div class="rk-panel-head"><h2 id="ho-panel-h" tabindex="-1">Assign scope</h2></div><div class="rk-panel-body">' + SA.refusalHtml('holder-' + x.id) +
      (errs.length ? '<div class="rk-errsum" id="ho-errs" tabindex="-1" role="alert"><p class="rk-errsum-t">Check the scope</p><ul>' + errs.map(e => '<li><a href="#ho-' + e + '" data-act="focusField" data-id="' + (e === 'kind' ? 'ho-k0' : 'ho-v') + '">' + esc(f.errs[e]) + '</a></li>').join('') + '</ul></div>' : '') +
      '<fieldset class="rk-fieldset' + (f.errs.kind ? ' is-invalid' : '') + '"><legend>What can they act on?</legend><div class="rk-choices">' + [['all', 'All experiments', 'Everything on the platform, now and later.'], ['course', 'A course', 'Every experiment in one course.'], ['experiment', 'One experiment', 'Only the experiment you choose.']].map((o, i) => '<label class="rk-choice" for="ho-k' + i + '"><input type="radio" name="ho-kind" id="ho-k' + i + '" value="' + o[0] + '" data-bind="holder:' + x.id + '.form.kind" data-onchange="hoKind" data-id="' + x.id + '"' + (f.kind === o[0] ? ' checked' : '') + '><span class="rk-choice-t">' + o[1] + '</span><span class="rk-choice-d">' + o[2] + '</span></label>').join('') + '</div>' + (f.errs.kind ? '<p class="rk-ferr">' + SA.ico('rki-alert', '') + esc(f.errs.kind) + '</p>' : '') + '</fieldset>' +
      (f.kind === 'course' ? SA.field({ id: 'ho-v', label: 'Course', bind: 'holder:' + x.id + '.form.v', value: f.v, select: courseOpts, err: f.errs.v }) : f.kind === 'experiment' ? SA.field({ id: 'ho-v', label: 'Experiment', bind: 'holder:' + x.id + '.form.v', value: f.v, select: expOpts, err: f.errs.v }) : '') +
      '<button type="button" class="rb-btn rb-btn--primary rk-go" id="ho-go" data-act="hoAssign" data-id="' + x.id + '">Assign scope</button><p class="rk-hint">Scope decides what appears in their workspace. It doesn’t change their role.</p></div></div></aside></div></div>';
    return h;
  };
  A.goHoPanel = () => { const el = document.getElementById('ho-panel'); if (el) el.scrollIntoView({ block: 'start' }); SA.focus('ho-panel-h'); };
  A.hoKind = d => { const x = SA.holder(d.id); x.form.v = ''; x.form.errs = {}; };
  A.hoAssign = d => {
    const S = SA.S, x = SA.holder(d.id), f = x.form, e = {};
    if (!f.kind) e.kind = 'Choose what they can act on';
    else if (f.kind !== 'all' && !f.v) e.v = f.kind === 'course' ? 'Choose a course' : 'Choose an experiment';
    const v = f.kind === 'all' ? 'All experiments' : f.v;
    if (!Object.keys(e).length && x.scope.some(s => s.st === 'active' && s.kind === f.kind && s.v === v)) e.v = 'They already have this scope';
    if (!Object.keys(e).length && f.kind !== 'all' && x.scope.some(s => s.st === 'active' && s.kind === 'all')) e.kind = 'They already have All experiments, which includes this';
    if (Object.keys(e).length) { f.errs = e; SA.render(); SA.focus('ho-errs'); return; }
    if (SA.staleGuard('holder-' + x.id)) return;
    const when = SA.now(), before = S.content.filter(c => SA.contentStatus(c) === 'stuck').map(c => c.id);
    x.scope = x.scope.filter(s => !(s.st === 'withdrawn' && s.kind === f.kind && s.v === v));
    x.scope.push({ kind: f.kind, v, st: 'active', when: S.A.short }); x.hist.unshift(['Scope assigned: ' + (f.kind === 'course' ? v : v), when, 'Arjun Mehta']);
    const unstuck = before.filter(id => SA.contentStatus(SA.content(id)) !== 'stuck').map(id => SA.content(id));
    unstuck.forEach(c => c.hist.unshift(['Review can continue', when, x.name + ' now has ' + c.course + ' in scope.']));
    x.form = { kind: '', v: '', errs: {} };
    SA.setFlash('holder-' + x.id, 'Scope assigned: ' + v + '.', unstuck.length ? unstuck.map(c => c.name).join(', ') + ' is no longer stuck; it is now in their review queue.' : 'It now appears in their workspace.');
    SA.render(); SA.focus('sa-flash');
  };
  A.wdOpen = d => { SA.S.inline = { type: 'wd', i: Number(d.i), reason: '', err: '' }; SA.render(); SA.focus('wd-r-' + d.i); };
  A.wdCancel = d => { SA.S.inline = null; SA.render(); SA.focus('wd-btn-' + d.i); };
  A.wdSave = d => {
    const S = SA.S, x = SA.holder(d.id), i = Number(d.i), s = x.scope[i];
    if (!SA.T(S.inline.reason)) { S.inline.err = 'Add a reason — it is kept in the history'; SA.render(); SA.focus('wd-r-' + i); return; }
    const when = SA.now(), r = SA.T(S.inline.reason);
    s.st = 'withdrawn'; s.when = S.A.short; s.reason = r; x.hist.unshift(['Scope withdrawn: ' + scopeShort(s), when, '“' + r + '” · Arjun Mehta']);
    const stuck = S.content.filter(c => SA.contentStatus(c) === 'stuck' && c.st === 'review');
    S.inline = null; SA.setFlash('holder-' + x.id, 'Scope withdrawn: ' + scopeShort(s) + '.', stuck.length ? 'Nobody else reviews ' + stuck.map(c => c.course).filter((v, k, a) => a.indexOf(v) === k).join(', ') + ', so ' + stuck.map(c => c.name).join(', ') + ' is now stuck.' : 'The reason is kept with the scope.'); SA.render(); SA.focus('sa-flash');
  };
  A.rsOpen = d => SA.openDlg({ type: 'restoreScope', id: d.id, i: Number(d.i), opener: 'rs-btn-' + d.i }, 'dlg-ok');
  SA.DLG.restoreScope = dl => { const x = SA.holder(dl.id), s = x.scope[dl.i];
    return { title: 'Restore ' + scopeShort(s) + ' for ' + x.name + '?', desc: 'The same scope comes back. No reason is asked; the earlier withdrawal stays in the history.', ok: 'Restore scope', busyLabel: 'Restoring…', body: '',
      run: () => { if (SA.staleGuard('holder-' + x.id)) return; SA.busyThen(() => { const S = SA.S, when = SA.now(), before = S.content.filter(c => SA.contentStatus(c) === 'stuck').map(c => c.id);
        s.st = 'active'; s.when = S.A.short; delete s.reason; x.hist.unshift(['Scope restored: ' + scopeShort(s), when, 'Arjun Mehta']);
        const unstuck = before.filter(id => SA.contentStatus(SA.content(id)) !== 'stuck').map(id => SA.content(id)); unstuck.forEach(c => c.hist.unshift(['Review can continue', when, x.name + ' has ' + c.course + ' in scope again.']));
        S.dlg = null; SA.setFlash('holder-' + x.id, 'Scope restored: ' + scopeShort(s) + '.', unstuck.length ? unstuck.map(c => c.name).join(', ') + ' is no longer stuck.' : ''); SA.render(); SA.focus('sa-flash'); }); } }; };

  /* ═══ Operations shell ═════════════════════════════════════════════════════ */
  const opsHead = cur => '<div class="rk-head"><div class="rk-head-text"><p class="rb-eyebrow-date">' + esc(SA.S.A.long) + '</p><h1 class="rb-h1" id="page-h1" tabindex="-1">Operations</h1><p class="rk-sub">Device transfers, support reports and access that is ending.</p></div></div>' +
    '<nav class="rk-tabs sa-tabs" aria-label="Operations">' + [['dtr', 'Device transfers', '#/operations/device-transfers'], ['sup', 'Support', '#/operations/support'], ['end', 'Access ending', '#/operations/access-ending']].map(t => '<a class="rk-tab" href="' + t[2] + '"' + (t[0] === cur ? ' aria-current="page"' : '') + '>' + t[1] + '</a>').join('') + '</nav>';
  const DTR_LBL = { forwarded: ['info', 'Forwarded'], institution: ['ended', 'Still with the institution'], approved: ['ok', 'Approved'] };

  /* ═══ SA-18 Device transfers ═══════════════════════════════════════════════ */
  V.transfers = () => {
    const S = SA.S, tab = S.ui.dtrTab, mode = SA.listMode();
    const tabs = [['forwarded', 'Forwarded to BITS'], ['institution', 'Still with an institution'], ['approved', 'Approved']].map(t => t.concat([S.transfers.filter(x => x.st === t[0]).length]));
    const list = S.transfers.filter(x => x.st === tab);
    let h = opsHead('dtr') + '<section class="rk-surface" aria-label="Device transfers"><div class="rk-toolbar">' + SA.seg(tabs, tab, 'dtrTab', 'Show device transfers') + '</div>';
    if (mode !== 'ok') h += SA.listState(mode, { loading: 'Loading device transfers…', failed: 'We couldn’t load the device transfers', emptyT: 'No device transfers yet', emptyD: 'Transfers appear here when an Institute Admin forwards a student’s request.', emptyIco: 'rbi-vr' });
    else if (!list.length) h += '<div class="rk-state"><span class="rk-state-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#rbi-vr"></use></svg></span><p class="rk-state-t">' + esc(tab === 'forwarded' ? 'Nothing is waiting for your approval' : tab === 'institution' ? 'No transfer is still with an institution' : 'No transfer has been approved yet') + '</p><p class="rk-state-d">Transfers appear here when an Institute Admin forwards a student’s request.</p></div>';
    else h += '<div class="rk-tablewrap"><table class="rk-table"><caption>Device transfers, ' + esc(tabs.find(t => t[0] === tab)[1]) + '</caption><thead><tr><th scope="col" class="rk-c-inst">Student and format</th><th scope="col" class="rk-c-exp">Institution</th><th scope="col" class="rk-c-type">Forwarded by</th><th scope="col" class="rk-c-date">Forwarded</th><th scope="col" class="rk-c-st">Status</th></tr></thead><tbody>' +
      list.map(t => '<tr data-href="#/operations/device-transfers/' + t.id + '"><td class="rk-c-inst"><a class="rk-rowlink" href="#/operations/device-transfers/' + t.id + '" aria-label="' + esc(t.fmt + ' device transfer for ' + t.student + ', ' + DTR_LBL[t.st][1] + '. Open') + '">' + esc(t.student) + '</a><span class="rk-small">' + esc(t.fmt) + ' device transfer</span></td><td class="rk-c-exp"><span class="rk-strong">' + esc(t.inst) + '</span></td><td class="rk-c-type"><span class="rk-small" style="margin:0">' + esc(t.fwdBy || 'Not forwarded yet') + '</span></td><td class="rk-c-date"><span class="rk-inlabel">Forwarded </span>' + esc(t.fwd ? t.fwd.split(',')[0] : 'Not yet') + '</td><td class="rk-c-st">' + SA.pill(DTR_LBL[t.st][0], DTR_LBL[t.st][1]) + '</td></tr>').join('') + '</tbody></table></div>';
    return h + '<p class="rk-ca-foot">Approving moves a student’s authorisation to a new device. It doesn’t ship, collect or register a device. There is no Decline; a transfer BITS doesn’t approve stays Forwarded.</p></section>';
  };
  A.dtrTab = d => { SA.S.ui.dtrTab = d.k; SA.render(); SA.focus('seg-' + d.k); };

  /* ═══ SA-19 Device transfer decision ═══════════════════════════════════════ */
  V.transfer = t => {
    const S = SA.S, st = DTR_LBL[t.st];
    let h = SA.crumbs([['Operations', '#/operations/device-transfers'], ['Device transfers', '#/operations/device-transfers'], [t.student]]) + '<div class="rk-head"><div class="rk-head-text"><p class="rb-eyebrow-date">' + esc(S.A.long) + '</p><p class="rk-eyebrow">Device transfer</p><h1 class="rk-title" id="page-h1" tabindex="-1">' + esc(t.fmt + ' device transfer for ' + t.student) + '</h1><div class="rk-meta">' + SA.pill(st[0], st[1], true) + '<span>' + esc(t.inst) + '</span></div></div><a class="rb-btn rk-goto" href="#tr-panel" data-act="goTrPanel">Go to decision</a></div>';
    h += SA.flashHtml('dtr-' + t.id);
    const rows = [['Student', t.student + (t.studentNo ? ' · ' + t.studentNo : '')], ['Institution', t.inst], ['Format', t.fmt + (t.exp ? ' for ' + t.exp : '')]].concat(t.from ? [['Moving from', t.from]] : [], t.to ? [['New device', t.to]] : [], t.note ? [['Student’s note', '“' + t.note + '”']] : [], t.fwdBy ? [['Forwarded by', t.fwdBy]] : []);
    h += '<div class="rk-detailwrap"><div class="rk-detail"><div class="rk-surface rk-mainsheet"><section class="rk-sec" aria-labelledby="tr-d"><div class="rk-sec-h"><h2 class="rb-h2" id="tr-d">The transfer</h2></div><dl class="rk-dl">' + rows.map(r => '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>').join('') + '</dl>' + (!t.from ? '<p class="rk-hint" style="margin-top:12px">The device details for this request aren’t part of this sample.</p>' : '') + '</section>' +
      '<section class="rk-sec" aria-labelledby="tr-h"><div class="rk-sec-h"><h2 class="rb-h2" id="tr-h">History</h2><p class="rk-note">Newest first</p></div>' + (t.hist.length ? SA.timeline(t.hist) : '<p class="rk-next">No transfer requests yet.</p>') + '</section></div>';
    h += '<aside class="rk-aside" id="tr-panel" aria-labelledby="tr-panel-h"><div class="rk-panel"><div class="rk-panel-head"><h2 id="tr-panel-h" tabindex="-1">Your decision</h2></div><div class="rk-panel-body">' + SA.refusalHtml('dtr-' + t.id);
    if (t.st === 'forwarded') h += '<p class="rk-next">Approving moves ' + esc(t.student) + '’s ' + esc(t.fmt) + ' authorisation to the new device.</p><p class="rk-hint">Nothing is shipped, collected or registered from here. There is no Decline; a transfer BITS doesn’t approve stays Forwarded.</p><button type="button" class="rb-btn rb-btn--primary rk-go" id="tr-go" data-act="trGo" data-id="' + t.id + '">Approve transfer</button>';
    else if (t.st === 'approved') h += '<div class="rk-done" id="tr-done" tabindex="-1"><p>' + SA.pill('ok', 'Approved', true) + '</p><p class="rk-done-meta">Approved on ' + esc(t.apprWhen) + ' by ' + esc(t.apprBy === 'Arjun Mehta' && t.mine ? 'you' : t.apprBy) + '</p><p class="rk-next">' + esc(t.student) + ' and the Institute Admin see “Approved”. This decision is read-only.</p><a class="rb-btn" href="#/operations/device-transfers">Back to device transfers</a></div>';
    else h += '<div class="rk-notice rk-notice--off" role="status">' + SA.ico('rki-clock', '') + '<p class="rk-notice-t">Not BITS’s to decide yet</p><p class="rk-notice-d">It is still with the institution. It appears in Forwarded when the Institute Admin forwards it.</p></div>';
    return h + '</div></div></aside></div></div>';
  };
  A.goTrPanel = () => { const el = document.getElementById('tr-panel'); if (el) el.scrollIntoView({ block: 'start' }); SA.focus('tr-panel-h'); };
  A.trGo = d => SA.openDlg({ type: 'approveDtr', id: d.id, opener: 'tr-go' }, 'dlg-t');
  SA.DLG.approveDtr = dl => { const t = SA.S.transfers.find(x => x.id === dl.id);
    return { title: 'Approve the ' + t.fmt + ' device transfer for ' + t.student + '?', desc: 'Approving is not a refusal, so no reason is asked.', ok: 'Approve transfer', busyLabel: 'Approving…',
      body: SA.dlgList([t.from ? t.student + '’s ' + t.fmt + ' authorisation moves from ' + t.from.replace(/^.*asset tag /, '') + ' to ' + t.to.replace(/^.*asset tag /, '') + '.' : t.student + '’s ' + t.fmt + ' authorisation moves to the new device on the request.', t.student + ' and the Institute Admin see “Approved”.'], ['Nothing is shipped, collected or registered from here.']),
      run: () => { if (SA.staleGuard('dtr-' + t.id)) return; SA.busyThen(() => { const when = SA.now(); t.st = 'approved'; t.apprWhen = when; t.apprBy = 'Arjun Mehta'; t.mine = true; t.hist.unshift(['Approved by Arjun Mehta', when, 'The ' + t.fmt + ' authorisation moved to the new device.']);
        SA.S.dlg = null; SA.setFlash('dtr-' + t.id, 'Approved.', t.student + ' and the Institute Admin now see “Approved”.'); SA.render(); SA.focus('sa-flash'); }); } }; };

  /* ═══ SA-20 Support reports ════════════════════════════════════════════════ */
  const SUP = { open: ['info', 'Open'], reopened: ['warn', 'Reopened'], resolved: ['ok', 'Resolved'] };
  V.support = () => {
    const S = SA.S, tab = S.ui.supTab, mode = SA.listMode();
    const inTab = (s, k) => k === 'all' || (k === 'open' ? s.st !== 'resolved' : s.st === 'resolved');
    const tabs = [['open', 'Open'], ['resolved', 'Resolved'], ['all', 'All']].map(t => t.concat([S.support.filter(s => inTab(s, t[0])).length]));
    const list = S.support.filter(s => inTab(s, tab)).sort((a, b) => a.actIso.localeCompare(b.actIso));
    let h = opsHead('sup') + '<section class="rk-surface" aria-label="Support reports"><div class="rk-toolbar">' + SA.seg(tabs, tab, 'supTab', 'Show support reports') + '<p class="rk-hint">Sent from Help by anyone signed in · oldest first</p></div>';
    if (mode !== 'ok') h += SA.listState(mode, { loading: 'Loading support reports…', failed: 'We couldn’t load the support reports', emptyT: 'No support reports yet', emptyD: 'Reports sent from Help appear here.', emptyIco: 'rbi-life' });
    else if (!list.length) h += '<div class="rk-state"><span class="rk-state-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#rbi-life"></use></svg></span><p class="rk-state-t">' + (tab === 'open' ? 'Nothing is open' : 'No resolved reports yet') + '</p><p class="rk-state-d">Reports sent from Help appear here.</p></div>';
    else h += '<div class="rk-tablewrap"><table class="rk-table"><caption>Support reports, oldest first</caption><thead><tr><th scope="col" class="rk-c-inst">Report</th><th scope="col" class="rk-c-exp">From</th><th scope="col" class="rk-c-type">Where</th><th scope="col" class="rk-c-date">Last activity</th><th scope="col" class="rk-c-st">Status</th></tr></thead><tbody>' +
      list.map(s => '<tr data-href="#/operations/support/' + s.id + '"><td class="rk-c-inst"><a class="rk-rowlink" href="#/operations/support/' + s.id + '" aria-label="' + esc(s.title + ', ' + SUP[s.st][1] + '. Open the report') + '">' + esc(s.title) + '</a><span class="rk-small">Sent ' + esc(s.sent) + '</span></td><td class="rk-c-exp"><span class="rk-strong">' + esc(s.who) + '</span><span class="rk-small">' + esc(s.role + (s.instName ? ' · ' + s.instName : '')) + '</span></td><td class="rk-c-type"><span class="rk-small" style="margin:0">' + esc(s.where) + '</span></td><td class="rk-c-date"><span class="rk-inlabel">Last activity </span>' + esc(s.actLabel.replace(/^\w/, c => c.toUpperCase())) + '</td><td class="rk-c-st">' + SA.pill(SUP[s.st][0], SUP[s.st][1]) + '</td></tr>').join('') + '</tbody></table></div>';
    return h + '<p class="rk-ca-foot">The reporter reads your resolution note. No response-time target is set.</p></section>';
  };
  A.supTab = d => { SA.S.ui.supTab = d.k; SA.render(); SA.focus('seg-' + d.k); };

  /* ═══ SA-21 Support report ═════════════════════════════════════════════════ */
  V.report = s => {
    const S = SA.S, st = SUP[s.st];
    s.form = s.form || { note: '', err: '' };
    let h = SA.crumbs([['Operations', '#/operations/device-transfers'], ['Support', '#/operations/support'], [s.title]]) + '<div class="rk-head"><div class="rk-head-text"><p class="rb-eyebrow-date">' + esc(S.A.long) + '</p><p class="rk-eyebrow">Support report</p><h1 class="rk-title" id="page-h1" tabindex="-1">' + esc(s.title) + '</h1><div class="rk-meta">' + SA.pill(st[0], st[1], true) + '<span>' + esc(s.who + ', ' + s.role) + '</span><span class="rk-meta-sep" aria-hidden="true"></span><span>Sent ' + esc(s.sent) + '</span></div></div><a class="rb-btn rk-goto" href="#sp-panel" data-act="goSpPanel">Go to decision</a></div>';
    h += SA.flashHtml('sup-' + s.id);
    h += '<div class="rk-detailwrap"><div class="rk-detail"><div class="rk-surface rk-mainsheet"><section class="rk-sec" aria-labelledby="sp-w"><div class="rk-sec-h"><h2 class="rb-h2" id="sp-w">What they reported</h2></div><dl class="rk-dl"><dt>From</dt><dd>' + esc(s.who + ' · ' + s.role + (s.instName ? ' · ' + s.instName : '')) + '</dd><dt>What happened</dt><dd>' + esc(s.what) + '</dd><dt>Where</dt><dd>' + esc(s.where) + '</dd><dt>Screenshot</dt><dd>' + (s.shot ? esc(s.shot) + ' <span class="rk-hint">(file name only in this preview)</span>' : 'No screenshot added') + '</dd></dl></section>' +
      '<section class="rk-sec" aria-labelledby="sp-h"><div class="rk-sec-h"><h2 class="rb-h2" id="sp-h">History</h2><p class="rk-note">Newest first</p></div>' + SA.timeline(s.hist) + '</section></div>';
    h += '<aside class="rk-aside" id="sp-panel" aria-labelledby="sp-panel-h"><div class="rk-panel"><div class="rk-panel-head"><h2 id="sp-panel-h" tabindex="-1">' + (s.st === 'resolved' ? 'Resolved' : 'Resolve') + '</h2></div><div class="rk-panel-body">' + SA.refusalHtml('sup-' + s.id);
    if (s.st !== 'resolved') {
      if (s.st === 'reopened' && s.note) h += '<div class="rk-notice rk-notice--warn" role="status">' + SA.ico('rki-alert', '') + '<p class="rk-notice-t">Reopened by the reporter</p><p class="rk-notice-d">Your earlier note: “' + esc(s.note) + '”</p></div>';
      h += SA.field({ id: 'sp-note', label: 'Resolution note (required)', hint: 'The reporter sees this note on their report in Help & support.', bind: 'sup:' + s.id + '.form.note', value: s.form.note, textarea: true, err: s.form.err }) + '<button type="button" class="rb-btn rb-btn--primary rk-go" id="sp-go" data-act="spResolve" data-id="' + s.id + '">Resolve report</button><p class="rk-hint">No response-time target is set.</p>';
    } else h += '<div class="rk-done" id="sp-done" tabindex="-1"><p>' + SA.pill('ok', 'Resolved', true) + '</p><p class="rk-done-meta">Resolved on ' + esc(s.resolved) + '</p><blockquote class="rk-quote"><p>' + esc(s.note) + '</p><p class="rk-quote-by">Note shown to the reporter</p></blockquote><button type="button" class="rb-btn" id="sp-reopen" data-act="spReopen" data-id="' + s.id + '">Reopen</button><p class="rk-hint">It goes back to the open reports. The reporter sees it is open again. Your earlier note stays in the history.</p></div>';
    return h + '</div></div></aside></div></div>';
  };
  A.goSpPanel = () => { const el = document.getElementById('sp-panel'); if (el) el.scrollIntoView({ block: 'start' }); SA.focus('sp-panel-h'); };
  A.spResolve = d => {
    const s = SA.S.support.find(x => x.id === d.id), n = SA.T(s.form.note);
    if (!n) { s.form.err = 'Add a note — the reporter sees it'; SA.render(); SA.focus('sp-note'); return; }
    if (SA.staleGuard('sup-' + s.id)) return;
    const when = SA.now(); s.st = 'resolved'; s.note = n; s.resolved = when; s.actIso = SA.S.A.iso; s.actLabel = 'resolved ' + SA.dm(SA.S.A.iso); s.hist.unshift(['Resolved', when, '“' + n + '” · Arjun Mehta']); s.form = { note: '', err: '' };
    SA.setFlash('sup-' + s.id, 'Report resolved.', s.who + ' sees your note on their report.'); SA.render(); SA.focus('sa-flash');
  };
  A.spReopen = d => SA.openDlg({ type: 'reopen', id: d.id, opener: 'sp-reopen' }, 'dlg-ok');
  SA.DLG.reopen = dl => { const s = SA.S.support.find(x => x.id === dl.id);
    return { title: 'Reopen this report?', desc: 'It goes back to the open reports. The reporter sees it is open again. Your earlier note stays in the history.', ok: 'Reopen', busyLabel: 'Reopening…', body: '',
      run: () => { if (SA.staleGuard('sup-' + s.id)) return; SA.busyThen(() => { const when = SA.now(); s.st = 'reopened'; s.actIso = SA.S.A.iso; s.actLabel = 'reopened ' + SA.dm(SA.S.A.iso); s.hist.unshift(['Reopened', when, 'By Arjun Mehta.']);
        SA.S.dlg = null; SA.setFlash('sup-' + s.id, 'Report reopened.', 'It is back with the open reports.'); SA.render(); SA.focus('sa-flash'); }); } }; };

  /* ═══ SA-22 Access ending & renewals ═══════════════════════════════════════ */
  V.accessEnding = () => {
    const S = SA.S, iso = S.A.iso, mode = SA.listMode();
    const rows = S.insts.filter(i => i.plans.length).map(i => ({ i, e: SA.instEnd(i), st: SA.instStatus(i) })).filter(x => x.e && SA.days(iso, x.e) <= 15 && SA.days(iso, x.e) >= -15).sort((a, b) => a.e.localeCompare(b.e));
    let h = opsHead('end') + '<section class="rk-surface" aria-label="Access ending within 15 days, or recently ended"><div class="rk-sec-h sa-pad"><h2 class="rb-h2">Ending within 15 days, or recently ended</h2><p class="rk-note">As of ' + esc(S.A.short) + ' · soonest first</p></div>';
    if (mode !== 'ok') h += SA.listState(mode === 'empty' ? 'empty' : mode, { loading: 'Loading access ending…', failed: 'We couldn’t load access ending', emptyT: 'No access is ending in the next 15 days', emptyD: 'Institutions whose access ends within 15 days, or has just ended, appear here.', emptyIco: 'rbi-cal' });
    else if (!rows.length) h += SA.listState('empty', { emptyT: 'No access is ending in the next 15 days', emptyD: 'Institutions whose access ends within 15 days, or has just ended, appear here.', emptyIco: 'rbi-cal' });
    else h += '<div class="sa-tablewrap"><table class="sa-table sa-table--rows"><caption class="xr-sr">Access ending within 15 days, or recently ended, soonest first</caption><thead><tr><th scope="col">Institution</th><th scope="col">Access ends</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead><tbody>' +
      rows.map(x => { const n = SA.days(iso, x.e), ren = x.i.renewalKey && SA.req(x.i.renewalKey), renOpen = ren && SA.reqStatus(ren) === 'review';
        const stc = x.st === 'ended' ? SA.pill('ended', 'Access ended') + '<span class="rk-small">No renewal requested</span>' : ren ? SA.pill(renOpen ? 'info' : 'ok', renOpen ? 'Renewal in progress' : 'Renewal approved') + '<span class="rk-small">' + (renOpen ? 'Request under review' : 'The current term isn’t changed here') + '</span>' : SA.pill('warn', 'Reminder due') + '<span class="rk-small">Nothing is sent from here</span>';
        return '<tr><th scope="row" data-label="Institution"><a href="#/institutions/' + x.i.id + '">' + esc(x.i.name) + '</a><span class="rk-small">' + esc(x.i.kind) + (x.st === 'paused' ? ' · access paused' : '') + '</span></th><td data-label="Access ends"><span class="rk-strong">' + esc(SA.dmy(x.e)) + '</span><span class="rk-small">' + (n >= 0 ? SA.plural(n, 'day') + ' left' : 'Ended ' + SA.plural(-n, 'day') + ' ago') + '</span></td><td data-label="Status">' + stc + '</td><td data-label="Actions"><div class="sa-btnrow">' + (ren ? '<a class="rb-btn rb-btn--ghost" href="#/requests/' + ren.key + '" aria-label="Open the renewal request from ' + esc(x.i.name) + '">Open request</a>' : '') + '<a class="rb-btn rb-btn--ghost" href="#/institutions/' + x.i.id + '" aria-label="Open ' + esc(x.i.name) + '">Open institution</a></div></td></tr>'; }).join('') + '</tbody></table></div>';
    return h + '<p class="rk-ca-foot">“Reminder due” is a status only. Nothing is sent from here, and no reminder channel is set. Renewals come in as requests.</p></section>';
  };

  /* ═══ Shared surfaces borrowed from the XS contract ════════════════════════ */
  V.message = o => (o.inline ? '' : '') + '<div class="sa-msg"><span class="sa-msg-ico" aria-hidden="true">' + SA.ico(o.ico || 'rki-info', '') + '</span><h1 class="rk-title" id="page-h1" tabindex="-1">' + esc(o.t) + '</h1><p class="rk-sub">' + esc(o.d) + '</p><div class="sa-btnrow">' + o.act + '</div></div>';
  V.signedOut = () => '<div class="sa-msg"><span class="sa-msg-ico" aria-hidden="true">' + SA.ico('rki-out', '') + '</span><h1 class="rk-title" id="page-h1" tabindex="-1">You’re signed out</h1><p class="rk-sub">Sign in again to continue in the Super Admin workspace. In this preview nothing is stored and no password is asked.</p><div class="sa-btnrow"><a class="rb-btn rb-btn--primary rb-btn--lg" href="#/overview">Sign in again</a><a class="rb-link" href="#/help">Help &amp; support</a></div></div>';
  V.help = () => {
    const S = SA.S, H = S.ui.help, prev = SA.prevPlace || 'Overview';
    if (!H.where) H.where = 'Super Admin · ' + prev;
    let h = '<div class="rk-head"><div class="rk-head-text"><p class="rb-eyebrow-date">' + esc(S.A.long) + '</p><h1 class="rb-h1" id="page-h1" tabindex="-1">Help &amp; support</h1><p class="rk-sub">Something isn’t working? Report it here and follow what happens.</p></div></div>';
    h += SA.flashHtml('help');
    h += '<div class="sa-help"><section class="rk-surface" aria-labelledby="hp-r"><div class="rk-sec"><div class="rk-sec-h"><h2 class="rb-h2" id="hp-r">Report a problem</h2></div><p class="rk-next" style="margin-bottom:14px">Describe what went wrong. You can follow your report in My reports.</p>' +
      (H.errs.what ? '<div class="rk-errsum" id="hp-errs" tabindex="-1" role="alert"><p class="rk-errsum-t">One thing needs fixing</p><ul><li><a href="#hp-what" data-act="focusField" data-id="hp-what">Say what happened</a></li></ul></div>' : '') +
      '<div class="sa-form">' + SA.field({ id: 'hp-what', label: 'What happened?', hint: 'Say what you were doing and what you saw.', bind: 'ui.help.what', value: H.what, textarea: true, err: H.errs.what }) + SA.field({ id: 'hp-where', label: 'Where did it happen?', hint: 'Filled in from the page you came from. Change it if needed.', bind: 'ui.help.where', value: H.where }) +
      '<div class="rk-field"><label class="rk-label" for="hp-file">Screenshot (optional)</label><p class="rk-hint" id="hp-file-hint">A picture of the screen can help.</p><input id="hp-file" class="sa-file" type="file" accept="image/*" data-bind="ui.help.file" aria-describedby="hp-file-hint">' + (H.file ? '<p class="rk-hint">Added: ' + esc(H.file) + '</p>' : '') + '</div>' +
      '<div class="sa-btnrow"><button type="button" class="rb-btn rb-btn--primary rb-btn--lg" id="hp-send" data-act="helpSend">Send report</button></div></div></div></section>' +
      '<section class="rk-surface" aria-labelledby="hp-m"><div class="rk-sec"><div class="rk-sec-h"><h2 class="rb-h2" id="hp-m">My reports</h2><p class="rk-note">' + SA.plural(S.myReports.length, 'report') + '</p></div>' +
      (S.myReports.length ? '<ul class="sa-list">' + S.myReports.map(id => { const s = S.support.find(x => x.id === id); return '<li><div class="sa-list-row sa-list-row--static"><span class="sa-list-main"><span class="sa-list-t">' + esc(s.what) + '</span><span class="sa-list-d"><span>Sent ' + esc(s.sent) + '</span></span></span>' + SA.pill(SUP[s.st][0], SUP[s.st][1]) + '</div></li>'; }).join('') + '</ul>' : '<div class="rk-state" style="padding:28px 8px"><p class="rk-state-t">No reports yet</p><p class="rk-state-d">If something isn’t working, report it and follow it here.</p></div>') + '</div></section></div>';
    return h;
  };
  A.helpSend = () => {
    const S = SA.S, H = S.ui.help, w = SA.T(H.what);
    if (!w) { H.errs = { what: 'Say what happened, so it can be looked into' }; SA.render(); SA.focus('hp-errs'); return; }
    const id = 'my-report-' + (S.myReports.length + 1), when = SA.now();
    S.support.push({ id, title: w.length > 60 ? w.slice(0, 57) + '…' : w, who: D.SA.name, role: 'Super Admin', instId: null, sent: S.A.short, actIso: S.A.iso, actLabel: 'sent ' + SA.dm(S.A.iso), st: 'open', what: w, where: SA.T(H.where), shot: H.file || '', hist: [['Sent', when, '']] });
    S.myReports.unshift(id); S.ui.help = { what: '', where: '', file: '', errs: {} };
    SA.setFlash('help', 'Report sent', 'You can follow it in My reports. It also appears in Operations › Support.'); SA.render(); SA.focus('sa-flash');
  };
})();
