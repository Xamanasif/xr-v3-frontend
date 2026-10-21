  devVM(w, u) {
    const D = Component.DEV, P = this.person(w), d = w.dev, f = u.devf, paused = w.inst === 'paused';
    const devNow = d.stage === 'appr' ? d.newDev : d.dev, hasReq = d.stage !== 'none';
    const W = { sent: ['xr-st xr-st--warn rk-st-lg', 'With your Institute Admin', 'Your Institute Admin forwards it to BITS. Nothing changes on your device yet.'], fwd: ['xr-st xr-st--info rk-st-lg', 'Forwarded to BITS', 'BITS decides. Nothing changes on your device yet.'], appr: ['xr-st xr-st--ok rk-st-lg', 'Approved', 'BITS approved the transfer. Your authorised device is updated above.'] }[d.stage] || ['', '', ''];
    const hist = [];
    if (d.stage === 'appr') hist.push({ what: 'Approved by BITS', when: d.t.appr, note: 'The authorised device is now: ' + d.newDev });
    if (d.stage === 'fwd' || d.stage === 'appr') hist.push({ what: 'Forwarded to BITS by ' + D.ia, when: d.t.fwd, note: '' });
    if (hasReq) hist.push({ what: 'Requested by ' + P.name, when: d.t.dtr, note: 'From ' + (d.stage === 'appr' ? d.dev : d.dev) + ' to ' + d.newDev });
    hist.forEach((h, i) => { h.cls = i === 0 ? 'is-latest' : ''; h.hasNote = !!h.note; });
    // the request as three steps with their dates — the same three steps as "How a transfer works"
    const st = d.stage, fwdDone = st === 'fwd' || st === 'appr';
    const steps = !hasReq ? [] : [
      { k: 'Requested', s: this.nbd(d.t.dtr || ''), done: true, now: false },
      { k: 'Forwarded to BITS', s: fwdDone ? D.ia + ' · ' + this.nbd(d.t.fwd || '') : d.noIA ? 'Waiting for an Institute Admin' : 'With your Institute Admin', done: fwdDone, now: st === 'sent' },
      { k: st === 'appr' ? 'Approved by BITS' : 'BITS decides', s: st === 'appr' ? this.nbd(d.t.appr || '') : st === 'fwd' ? 'With BITS now' : 'Not yet', done: st === 'appr', now: st === 'fwd' }
    ].map(x => Object.assign(x, { cls: x.done ? 'is-done' : x.now ? 'is-now' : '', aria: x.k + ', ' + (x.done ? 'done' : x.now ? 'current' : 'not yet') + (x.s ? ', ' + x.s : '') }));
    return { steps, hasSteps: steps.length > 0, devUse: Component.EXP.ste.t, chip: this.fmtChip(w, 'VR'), hasDevice: !!devNow, noDevice: !devNow, device: devNow, canRequest: !!devNow && !paused && !f.form && (d.stage === 'none' || d.stage === 'appr'),
      openForm: () => this.apply({ ui: { devf: Object.assign({}, this.ui().devf, { form: true, err: '' }) }, focus: 'st-dev-new' }),
      pausedNote: paused && !!devNow, showForm: f.form && !paused && !!devNow && (d.stage === 'none' || d.stage === 'appr'),
      f: { dev: f.dev, note: f.note, err: f.err, hasErr: !!f.err, inv: f.err ? 'true' : 'false', desc: f.err ? 'st-dev-new-h st-dev-new-e' : 'st-dev-new-h' },
      onDev: ev => this.apply({ ui: { devf: Object.assign({}, this.ui().devf, { dev: ev.target.value, err: '' }) } }),
      onNote: ev => this.apply({ ui: { devf: Object.assign({}, this.ui().devf, { note: ev.target.value }) } }),
      cancelForm: () => this.apply({ ui: { devf: { form: false, dev: '', note: '', err: '', busy: false } }, focus: 'st-dev-req' }),
      send: () => this.sendDev(), busy: f.busy, busyAria: f.busy ? 'true' : 'false', sendLabel: f.busy ? 'Sending…' : 'Send request',
      reqTitle: hasReq ? 'Your transfer request' : 'Transfer requests', hasReq, noReq: !hasReq, hasRef: false, /* owner decision: internal record identifiers are not labels on Student pages. The DTR reference is still carried, below; restore the row with: hasReq && !!d.ref */ ref: d.ref, pillCls: W[0], words: W[1], explain: hasReq && d.noIA && d.stage === 'sent' ? 'Nothing changes on your device yet.' : W[2], noIA: hasReq && d.noIA && d.stage === 'sent',
      hasPrev: !!d.prev, prevText: d.prev ? 'Earlier request' + ' · approved ' + this.nbd(d.prev.when) : '',
      from: d.dev, to: d.newDev, hasNote: !!d.note, note: d.note, hist };
  }
