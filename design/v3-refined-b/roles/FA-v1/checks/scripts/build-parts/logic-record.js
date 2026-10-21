  vmRecord(nav) {
    const R = this.R, a = this.asm(R.a);
    if (!a || !this.expo(a.exp)) return null;
    const U = this.U, W = this.W, e = this.expo(a.exp), cr = this.course(e.crs), cfg = this.cur(a), own = this.own(a);
    const tabs = ['FA-08', 'FA-09', 'FA-10', 'FA-11', 'FA-12'], keys = ['sum', 'qs', 'set', 'pv', 'sub'];
    const tab = keys[tabs.indexOf(R.s)] || 'sum';
    const st = this.asmState(a), subs = this.attsOf(a.id).filter(t => t.submitted).sort((x, y) => String(x.subIso).localeCompare(String(y.subIso)));
    const wait = own ? subs.filter(t => this.waiting(t)) : [];
    const tg = {}, tc = {};
    keys.forEach((k, i) => { tc[k] = tab === k ? 'page' : undefined; tg[k] = ev => { if (ev && ev.preventDefault) ev.preventDefault(); this.R = { s: tabs[i], a: a.id }; U.menu = false; this.bump(); this.focusLater('fa-tabh'); }; });
    const coName = this.person(a.by).name, ssL = this.stuOf(e.id), ss = ssL.length, tot = this.marksOf(cfg), ready = this.isReady(a), hasQ = cfg.qs.length > 0;
    /* record band figures: deadline · students submitted (own, ready) · questions — the waiting count stays a link in the meta line */
    const iso = this.parseWhen(cfg.dl), days = iso ? Math.round((this.utc(iso) - this.utc(W.clock.iso)) / 86400000) : 0, past = !!iso && this.nowIso() > iso;
    const figs = [];
    figs.push(!cfg.dl ? { k: 'Deadline', v: 'Not set yet', vCls: 'fr-fig-v is-quiet' } : !iso || !ready ? { k: 'Deadline', v: cfg.dl, vCls: 'fr-fig-v fr-fig-v--date' } : past ? { k: cfg.dl, v: 'Deadline passed', vCls: 'fr-fig-v' } : { k: 'Due ' + cfg.dl, v: days === 0 ? 'Due today' : this.plural(days, 'day') + ' left', vCls: 'fr-fig-v is-warn' });
    if (own && ready) {
      const su = this.unitsOf(ssL.map(s => subs.some(t => t.st === s.id) ? 'is-sub' : '').sort((x, y) => (y ? 1 : 0) - (x ? 1 : 0)));
      figs.push(ss ? { k: 'Students submitted', v: subs.length + ' of ' + ss, vCls: 'fr-fig-v', hasUnits: true, units: su.units, unitsCls: su.cls } : { k: 'Students with access', v: 'None yet', vCls: 'fr-fig-v is-quiet' });
    }
    figs.push(hasQ ? { k: 'Questions · ' + this.plural(tot, 'mark'), v: String(cfg.qs.length), vCls: 'fr-fig-v' } : { k: 'Questions', v: 'None yet', vCls: 'fr-fig-v is-quiet' });
    figs.forEach(f => { if (!f.hasUnits) Object.assign(f, { hasUnits: false, units: [], unitsCls: '' }); });
    const nm = a.name || 'Untitled draft';
    const AR = { id: a.id, name: nm, h1: nm.replace(/ — /g, ' — '), code: cr.code, expT: e.t, ctx: cr.code + ' · ' + e.t, st: st.label, stCls: st.cls, due: cfg.dl ? 'Due ' + cfg.dl : 'No deadline yet',
      figs, hasVerShort: cfg.n > 1, verShort: 'Version ' + cfg.n, byLine: 'Created by ' + coName,
      hasWait: wait.length > 0, waitText: wait.length + ' waiting for marking', tabsAria: (a.name || 'Assessment') + ' sections', tc, tg,
      nQ: String(cfg.qs.length), hasSubN: own && subs.length > 0, nSub: String(subs.length), own, notOwn: !own,
      coNote: coName + ' created this assessment. You can read its rules; changes, the answer key and submissions aren’t available to co-teachers yet.',
      coRefuse: coName + ' created this assessment. Its answer key, marking guidance, submissions and results aren’t shown to co-teachers while sharing between co-teachers is being decided.',
      isSum: tab === 'sum', isQs: tab === 'qs', isSet: tab === 'set', isPv: tab === 'pv', isSub: tab === 'sub' };
    /* keep the current tab in view when the tab row scrolls (narrow widths) */
    const tk = a.id + ':' + tab;
    if (this.tabKey !== tk) { this.tabKey = tk; window.setTimeout(() => { const n = document.querySelector('#fa-main .fa-tabs'), t = n && n.querySelector('[aria-current="page"]'); if (n && t && n.scrollWidth > n.clientWidth + 1) n.scrollLeft = Math.max(0, t.offsetLeft - 24); }, 30); }
    const out = { AR };
    const rulesList = [{ k: 'Introduction', v: a.intro || 'None' }, { k: 'Pass mark', v: this.whole(cfg.pass, 0, 100) ? cfg.pass + '%' + (tot ? ' · ' + this.passMarks(cfg) + ' of ' + tot + ' marks' : '') : 'Not set yet' }, { k: 'Attempts allowed', v: cfg.att || 'Not set yet' }, { k: 'Deadline', v: cfg.dl || 'Not set yet' }, { k: 'Result and answers', v: cfg.rel ? this.relWords(cfg) : 'Not chosen yet' }, { k: 'Time limit', v: 'None' }];
    if (tab === 'sum' || (tab === 'set' && !own)) {
      const rOk = this.rulesOk(cfg), vn = this.verNote(a), pinned = this.subsOn(a, cfg.n);
      out.AS = {
        facts: [{ k: 'Questions', v: hasQ ? this.plural(cfg.qs.length, 'question') + ' · ' + tot + ' marks' : 'None yet', cls: hasQ ? '' : 'is-quiet' }, { k: 'Pass mark', v: this.whole(cfg.pass, 0, 100) ? cfg.pass + '%' + (hasQ ? ' · ' + this.passMarks(cfg) + ' of ' + tot : '') : 'Not set yet', cls: '' }, { k: 'Attempts allowed', v: cfg.att || 'Not set yet', cls: '' }, { k: 'Deadline', v: cfg.dl || 'Not set yet', cls: '' }, { k: 'Results', v: cfg.rel ? this.relWords(cfg) : 'Not chosen yet', cls: '' }],
        readyH: ready ? 'Ready to use' : 'Draft — not ready', readyD: ready ? 'Students who have ' + e.t + ' can see and start it.' : 'Students can’t see a draft. ' + (hasQ ? 'Finish the rules to make it ready.' : 'It needs at least one question.'),
        checklist: [{ t: 'Name and introduction', ok: !!(a.name || '').trim() }, { t: rOk ? 'Rules set for this assessment' : 'Rules — not finished', ok: rOk }, { t: hasQ ? this.plural(cfg.qs.length, 'question') + ' · ' + tot + ' marks' : 'At least one question — none yet', ok: hasQ }].map(x => Object.assign(x, { no: !x.ok, cls: x.ok ? 'is-ok' : 'is-no' })),
        needQs: own && !hasQ, hasVer: !!vn, verT: vn ? vn.t : '', verD: vn ? vn.d : '',
        reach: ss ? this.plural(ss, 'student') + ' who have ' + e.t + ' from Godavari Institute of Technology. Formats don’t change who it reaches: one assessment covers the experiment, whichever format a student used.' : 'No students have ' + e.t + ' yet. It reaches students when your Institute Admin gives them the experiment.',
        rules: rulesList,
        rules2: rulesList.slice(1).map(r => Object.assign({}, r, { cls: /^Not (set|chosen) yet$/.test(r.v) ? 'is-quiet' : '' })),
        intro: a.intro || 'None', introCls: 'fr-introtext' + (a.intro ? '' : ' is-quiet'),
        created: 'Created ' + a.created + ' by ' + (own ? 'you' : coName) + (a.readySince ? ' · ready since ' + a.readySince : ' · not ready yet') + (cfg.n > 1 ? ' · version ' + cfg.n + ' since ' + cfg.since : ''),
        subBig: String(subs.length), subOf: 'of ' + this.plural(ss, 'student') + ' submitted', hasWait: wait.length > 0, waitText: this.plural(wait.length, 'written answer') + ' waiting for marking',
        waitList: wait.map(t => ({ n: this.stu(t.st).n, w: String(t.submitted).replace(/ \d{4},/, ',') })),
        noWait: own && !wait.length && (subs.length > 0 || ready), noWaitT: subs.length ? 'Nothing is waiting for marking.' : 'No submissions yet.',
        subNote: pinned.length ? 'Students have submitted. If you change the questions or rules now, that makes a new version — earlier submissions keep theirs.' : subs.length ? 'Earlier submissions keep the version they answered.' : ready ? 'No one has submitted yet. You can change the questions and rules freely.' : 'Students can’t see a draft, so no one can submit yet.',
        markNext: wait.length ? this.link({ s: 'FA-19', att: wait[0].id }) : null
      };
    }
    if (tab === 'qs') out.AQ = this.vmQuestionsTab(a);
    if (tab === 'set' && own) out.ST = this.vmSettings(a);
    if (tab === 'pv') out.PV = this.vmPreview(a);
    if (tab === 'sub') out.SB = this.vmSubmissions(a, subs);
    return out;
  }
