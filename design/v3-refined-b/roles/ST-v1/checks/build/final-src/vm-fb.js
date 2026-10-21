  fbVM(w, f) {
    const E = Component.EXP.ste, Q = Component.FBQ, SC = Component.SCALE, sent = w.fb[f], d = this.fbDraft(f), pid = 'st-fb-' + f.toLowerCase();
    const V = { exp: E.t, code: f, crumbExp: this.L({ s: 'hub', exp: 'ste', tab: 'overview' }), crumbFmt: this.L(f === 'WEB' ? { s: 'web', exp: 'ste' } : { s: 'fmt', exp: 'ste', fmt: f }), progress: this.L({ s: 'prog' }),
      form: !sent, sent: !!sent, h1: sent ? 'Feedback on ' + f + ' sent' : 'Feedback on ' + f, formAria: 'Feedback on ' + f, chip: this.fmtChip(w, f) };
    if (sent) {
      V.when = sent.when;
      // each answer shown on the same five-point scale as the form (read-only), with its words
      V.answers = Q.map((t, i) => { const v = sent.ans[i + 1];
        return { t: (i + 1) + '. ' + t, v: v ? v + ' — ' + SC[v - 1] : '—', dots: [1, 2, 3, 4, 5].map(k => ({ k: String(k), cls: 'sv-lk-dot' + (k === v ? ' is-on' : '') })) }; });
      V.commentText = sent.comments || '—';
      return V;
    }
    V.qs = Q.map((t, i) => {
      const n = i + 1, err = d.errs.includes(n);
      const pickedV = d.ans[n], sel = pickedV ? pickedV + ' — ' + SC[pickedV - 1] : 'Not rated yet';
      return { n, t: n + '. ' + t, name: pid + '-q' + n, fsId: pid + '-q' + n, cls: 'st-fbq sv-lk-q' + (err ? ' is-invalid' : ''), err, errText: 'Choose a rating for statement ' + n, errId: pid + '-q' + n + '-e', desc: err ? pid + '-q' + n + '-e' : undefined, sel, selCls: 'sv-lk-sel' + (pickedV ? ' is-set' : ''),
        opts: SC.map((lab, j) => ({ v: j + 1, lab, id: pid + '-q' + n + '-' + (j + 1), checked: d.ans[n] === j + 1,
          pick: () => { const c = this.fbDraft(f); this.setFb(f, { ans: Object.assign({}, c.ans, { [n]: j + 1 }), errs: c.errs.filter(x => x !== n) }); } })) };
    });
    V.scale = SC.map((lab, j) => ({ v: String(j + 1), lab }));
    V.hasErr = d.errs.length > 0;
    V.errTitle = d.errs.length === 1 ? 'One rating is missing' : d.errs.length + ' ratings are missing';
    V.errList = d.errs.map(n => ({ t: 'Choose a rating for statement ' + n, href: '#' + pid + '-q' + n, go: ev => { if (ev) ev.preventDefault(); this.focusId(pid + '-q' + n + '-1'); } }));
    V.fail = d.fail; V.comments = d.comments; V.onComments = ev => this.setFb(f, { comments: ev.target.value });
    V.busy = d.busy; V.busyAria = d.busy ? 'true' : 'false'; V.goLabel = d.busy ? 'Sending…' : 'Submit feedback'; V.submit = () => this.sendFb(f);
    return V;
  }
