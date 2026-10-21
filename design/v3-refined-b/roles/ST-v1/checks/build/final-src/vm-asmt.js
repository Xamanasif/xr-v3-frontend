  alistVM(w, r, u) {
    const A = Component.ASM, AS = this.asmtRow(w), tab = r.tab || 'todo', E = Component.EXP.ste, C = Component.CRS, a = w.asmt;
    const V = { noneAtAll: !AS.has, showTabs: AS.has, loading: u.data === 'loading', failed: u.data === 'failed', retry: () => this.apply({ ui: { data: 'ok' }, focus: 'st-h1' }), rows: [], has: false, empty: false };
    // the empty state states the fact for each experiment you have; it adds no action
    V.noneD = w.grant === 'none' ? 'When your institution gives you an experiment and your faculty sets an assessment for it, it appears here.' : 'When your faculty sets an assessment for an experiment you have, it appears here.';
    V.exps = this.current(w) ? [{ t: E.t, c: C.own + ' · ' + C.name, s: 'No assessment set yet' }] : [];
    V.hasExps = V.exps.length > 0;
    const n = t => (AS.has && AS.tab === t ? 1 : 0);
    V.tabs = [['todo', 'To do'], ['sub', 'Submitted'], ['res', 'Results']].map(t => Object.assign({ t: t[1], n: String(n(t[0])), hasN: !V.loading && !V.failed, cur: t[0] === tab ? 'page' : undefined }, this.L({ s: 'alist', tab: t[0] })));
    V.tabTitle = { todo: 'To do', sub: 'Submitted', res: 'Results' }[tab];
    if (V.loading || V.failed || !AS.has) return V;
    if (AS.tab === tab) {
      // each row leads with its key date — the deadline while it is open, the release date once results are out
      const rel = a.st === 'ready', after = a.st === 'wait' || a.st === 'notrel';
      const when = this.whenOf(w, rel ? a.released : A.deadline);
      if (rel || after) when.cls = 'sv-when';
      const sub = { todo: '4 questions · 16 marks · no time limit', noq: 'It has no questions yet', prog: 'Your answers are saved · no time limit', wait: 'Submitted ' + this.nbd(a.submitted) + ' · your faculty marks written answers', notrel: 'Marked · released after the deadline', ready: 'Your result and answers are ready' }[a.st];
      V.rows = [Object.assign({}, AS, { kicker: AS.exp, desc: A.desc, whenK: rel ? 'Released' : after ? 'Result after' : 'Due', when, sub })];
      V.has = true;
    } else {
      V.empty = true; V.emptyText = { todo: 'Nothing to do right now.', sub: 'Nothing submitted and waiting.', res: 'No results released yet.' }[tab];
      V.emptyD = { todo: 'Your assessment is under To do.', sub: 'Your submitted assessment is under Submitted.', res: 'Your released result is under Results.' }[AS.tab];
    }
    return V;
  }
  introVM(w) {
    const A = Component.ASM, E = Component.EXP.ste, a = w.asmt, sc = this.score(w), passed = sc >= A.passm, left = A.attempts - (a.used || 0), AS = this.asmtRow(w);
    const p = (label, rt, go) => go ? { label, cls: 'rb-btn rb-btn--primary rb-btn--lg', href: '#' + this.path(rt), go } : this.act(label, rt, 'rb-btn rb-btn--primary rb-btn--lg');
    const s = (label, rt) => this.act(label, rt, 'rb-btn rb-btn--lg');
    const back = s('Back to experiment', { s: 'hub', exp: 'ste', tab: 'assessment' });
    // the state is the card's heading (no separate notice); the same words the notice used
    const state = (t, d) => ({ t, d, hasD: !!d });
    const answeredN = A.qs.filter(q => this.answered(a, q.n)).length;
    const V = { crumb: this.L({ s: 'alist', tab: 'todo' }), expLink: this.L({ s: 'hub', exp: 'ste', tab: 'assessment' }), exp: E.t, name: A.name, desc: A.desc, setBy: A.fac,
      pillCls: AS.pillCls || 'xr-st', pill: AS.pill || '', when: this.whenOf(w, A.deadline), rules: false };
    V.facts = [{ k: 'Questions', v: '4', s: A.mix }, { k: 'Total marks', v: String(A.total) }, { k: 'Pass mark', v: A.passpct, s: A.passm + ' of ' + A.total + ' marks' },
      { k: 'Attempts allowed', v: String(A.attempts), s: a.used ? 'You have used ' + a.used : 'You have used none' }, { k: 'Result and answers', v: 'After the deadline', s: 'Your faculty marks written answers' }]
      .map(f => Object.assign({ hasS: !!f.s }, f));
    V.deadline = A.deadline;
    if (a.st === 'todo') { V.st = state('Before you start', ''); V.rules = true; V.acts = [p('Start assessment', { s: 'att' }, ev => { if (ev) ev.preventDefault(); this.startAttempt(); }), back]; }
    else if (a.st === 'prog') { V.st = state('Attempt ' + a.attempt + ' in progress', 'Your answers are saved. ' + this.plural(answeredN, 'question').replace(/^1 question$/, 'One question') + ' of 4 answered.'); V.rules = true; V.acts = [p('Continue attempt', { s: 'att' }), back]; }
    else if (a.st === 'wait') { V.st = state('Submitted — waiting for marking', 'You submitted on ' + this.nbd(a.submitted) + '. Your result appears after the deadline: ' + this.nbd(A.deadline) + '.'); V.acts = [s('See result page', { s: 'ares' }), back]; }
    else if (a.st === 'notrel') { V.st = state('Marked — result not released yet', 'Results for this assessment are released after the deadline: ' + this.nbd(A.deadline) + '.'); V.acts = [s('See result page', { s: 'ares' }), back]; }
    else if (a.st === 'noq') { V.st = state('This assessment can’t be started yet', 'It has no questions yet. It appears ready to start when your faculty has added them.'); V.acts = [back]; }
    else if (a.st === 'ready' && !passed && left > 0) { V.st = state('Not passed on attempt ' + a.used + ' · ' + this.plural(left, 'attempt') + ' left', 'You can try once more. Your first result stays on your result page.'); V.rules = true; V.acts = [p('Try again', { s: 'att' }, ev => { if (ev) ev.preventDefault(); this.retryAttempt(); }), s('See result', { s: 'ares' })]; }
    else if (a.st === 'ready') { V.st = state(passed ? 'Result released — you passed' : 'Result released', 'Released ' + this.nbd(a.released) + ', after the deadline.'); V.acts = [p('See result', { s: 'ares' }), back]; }
    else { V.st = state('', ''); V.acts = [back]; }
    return V;
  }
  attVM(w, u) {
    const A = Component.ASM, E = Component.EXP.ste, a = w.asmt, att = u.att;
    const missing = A.qs.filter(q => !this.answered(a, q.n)).map(q => q.n);
    const form = a.st === 'todo' || a.st === 'prog';
    const V = { exit: this.L({ s: 'aintro' }), exitLabel: A.name, exp: E.t, name: A.name, attemptText: 'Attempt ' + (a.attempt || 1) + ' of ' + A.attempts,
      meta: '4 questions · 16 marks · due ' + this.nbd(A.deadline) + ' · no time limit', form, done: !form, showSave: form,
      saveIdle: att.save === 'idle', saving: att.save === 'saving', saved: att.save === 'saved', saveErr: att.save === 'err',
      retrySave: () => { this.setAtt({ save: 'saving' }); window.setTimeout(() => this.setAtt({ save: 'saved' }), 600); },
      result: this.L({ s: 'ares' }), backExp: this.L({ s: 'hub', exp: 'ste', tab: 'assessment' }),
      doneText: (a.submitted ? 'Submitted ' + a.submitted + '. ' : '') + 'Your faculty marks written answers. Your result appears after the deadline: ' + A.deadline + '.' };
    V.qs = A.qs.map(q => {
      const isW = q.type === 'written', done = this.answered(a, q.n);
      return { anchor: 'st-q-' + q.n, hid: 'st-q-' + q.n + '-h', n: String(q.n), label: 'Question ' + q.n + ' of 4 · ' + q.tname, marksText: q.marks + ' marks', text: q.text, isChoice: !isW, isW, name: 'st-att-q' + q.n,
        numCls: 'sv-q-n' + (done ? ' is-done' : ''), tid: 'st-q-' + q.n + '-t', hintId: 'st-q-' + q.n + '-hint', val: isW ? (a.ans[q.n] || '') : '', onText: ev => this.answer(q.n, ev.target.value),
        opts: q.opts.map((lab, j) => ({ id: 'st-q-' + q.n + '-o' + j, lab, checked: a.ans[q.n] === j, pick: () => this.answer(q.n, j) })) };
    });
    V.strip = A.qs.map(q => { const done = this.answered(a, q.n); return { n: q.n, href: '#st-q-' + q.n, cls: done ? 'is-done' : '', aria: 'Question ' + q.n + (done ? ', answered' : ', not answered'), go: ev => { if (ev) ev.preventDefault(); this.focusId('st-q-' + q.n); } }; });
    V.countText = (4 - missing.length) + ' of 4 answered';
    V.hasMissing = missing.length > 0; V.allAnswered = missing.length === 0; V.nq = '4';
    V.missText = missing.length === 1 ? '1 question isn’t answered (question ' + missing[0] + ').' : missing.length + ' questions aren’t answered (' + missing.join(', ') + ').';
    V.nextUn = () => { if (missing.length) this.focusId('st-q-' + missing[0]); };
    V.subErr = att.subErr; V.dlg = form && att.dlg; V.busy = att.busy; V.busyAria = att.busy ? 'true' : 'false'; V.okLabel = att.busy ? 'Submitting…' : 'Submit answers';
    V.submit = () => this.setAtt({ dlg: true, subErr: false }, 'st-dlg-t');
    V.cancel = () => this.setAtt({ dlg: false }, 'st-submit');
    V.doSubmit = () => this.doSubmit();
    V.dlgKey = ev => this.trapKey(ev, () => this.setAtt({ dlg: false }, 'st-submit'), 'st-dlg-cancel', 'st-dlg-ok');
    return V;
  }
  resultVM(w) {
    const A = Component.ASM, E = Component.EXP.ste, a = w.asmt, sc = this.score(w), passed = sc >= A.passm, left = A.attempts - (a.used || 0);
    const V = { crumbList: this.L({ s: 'alist', tab: 'todo' }), crumbIntro: this.L({ s: 'aintro' }), name: A.name, fac: A.fac, withheld: a.st !== 'ready', released: a.st === 'ready',
      back: Object.assign({ label: 'Back to experiment' }, this.L({ s: 'hub', exp: 'ste', tab: 'assessment' })), progress: this.L({ s: 'prog' }) };
    // withheld results use the compact message card (sv-refuse); the words are unchanged
    if (a.st === 'todo' || a.st === 'prog' || a.st === 'noq') Object.assign(V, { ico: 'sti-clip', icoCls: 'sv-refuse-ico sv-refuse-ico--off', h1: 'Not submitted yet', d: 'Your result appears here after you submit and your answers are marked.', back: Object.assign({ label: 'Back to the assessment' }, this.L({ s: 'aintro' })) });
    if (a.st === 'wait') Object.assign(V, { ico: 'sti-clock', icoCls: 'sv-refuse-ico', h1: 'Submitted — waiting for marking', d: 'You submitted on ' + this.nbd(a.submitted) + '. Your faculty marks written answers. Your result appears after the deadline: ' + this.nbd(A.deadline) + '.' });
    if (a.st === 'notrel') Object.assign(V, { ico: 'sti-clock', icoCls: 'sv-refuse-ico sv-refuse-ico--off', h1: 'Result not released yet', d: 'Your answers have been marked. Results for this assessment are released after the deadline: ' + this.nbd(A.deadline) + '.' });
    if (a.st !== 'ready') return V;
    Object.assign(V, { h1: passed ? 'You passed' : 'Not passed this time', score: String(sc), total: 'of ' + A.total + ' marks', pillCls: passed ? 'xr-st xr-st--ok rk-st-lg' : 'xr-st rk-st-lg', pill: passed ? 'Passed' : 'Not passed',
      passText: A.passpct + ' · ' + A.passm + ' of ' + A.total + ' marks', attemptText: 'Attempt ' + (a.used || 1) + ' of ' + A.attempts, releasedText: 'Released ' + this.nbd(a.released) + ', after the deadline',
      canRetry: !passed && left > 0, left: String(left), leftText: 'You have ' + this.plural(left, 'attempt') + ' left. Your first result stays here.', retry: { href: '#' + this.path({ s: 'att' }), go: ev => { if (ev) ev.preventDefault(); this.retryAttempt(); } } });
    V.answers = A.qs.map(q => {
      const isW = q.type === 'written', v = a.ans[q.n], got = isW ? Number(a.mark || 0) : (v === q.correct ? q.marks : 0);
      const none = isW ? !v : (v === undefined || v === null), right = !isW && v === q.correct;
      return { id: 'st-ans-' + q.n, hid: 'st-ans-' + q.n + '-h', n: String(q.n), head: 'Question ' + q.n + ' · ' + q.tname, text: q.text, yours: isW ? (v || 'Not answered') : (none ? 'Not answered' : q.opts[v]), isChoice: !isW, isW,
        right, showCorrect: !isW && !right, correct: isW ? '' : q.opts[q.correct], verdict: isW ? '' : right ? 'Correct' : none ? 'Not answered' : 'Not correct', verdictCls: right ? 'sv-verdict sv-verdict--ok' : 'sv-verdict',
        expl: q.expl, markText: got + ' of ' + q.marks + ' marks', pillCls: got === q.marks ? 'xr-st xr-st--ok' : 'xr-st', hasFb: isW && !!a.fbText, fb: isW ? a.fbText : '' };
    });
    // marks by question: a jump list to each answer below (the marks are the released marks)
    V.byQ = V.answers.map((x, i) => ({ n: x.n, mark: x.markText.replace(' marks', ''), cls: 'sv-byq-i' + (x.pillCls.indexOf('--ok') > 0 ? ' is-full' : ''), aria: 'Question ' + x.n + ': ' + x.markText, href: '#' + x.id,
      go: ev => { if (ev) ev.preventDefault(); this.focusId(x.id); } }));
    return V;
  }
