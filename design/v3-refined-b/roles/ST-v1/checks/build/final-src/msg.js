  msg(kind, r, w, exp) {
    const C = Component.CRS, E = Component.EXP.ste;
    const p = (label, rt) => this.act(label, rt, 'rb-btn rb-btn--primary rb-btn--lg');
    const s = (label, rt) => this.act(label, rt, 'rb-btn rb-btn--lg');
    const crumbC = [Object.assign({ t: 'My courses' }, this.L({ s: 'courses', tab: 'courses' }))];
    const crumbX = [Object.assign({ t: E.t }, this.L({ s: 'hub', exp: 'ste', tab: 'overview' })), Object.assign({ t: 'Simulation' }, this.L({ s: 'hub', exp: 'ste', tab: 'simulation' }))];
    // Student refusals are a compact card (sv-refuse); the borrowed XS-06 / XS-08 messages keep their XS form (xsb-msg).
    const ico = (i, tone) => ({ ico: i, icoCls: 'sv-refuse-ico' + (tone ? ' sv-refuse-ico--' + tone : '') });
    const xsIco = (i, tone) => ({ ico: i, icoCls: 'xsb-msg-ico' + (tone ? ' xsb-msg-ico--' + tone : '') });
    const earlier = [p('See your earlier work', { s: 'prog' }), s('Back to My courses', { s: 'courses', tab: 'courses' })];
    // What the student can still do, shown inside the message — only facts and destinations that already exist.
    const fmtAlt = () => ['WEB', 'VR'].map(f => { const st = this.fmtStatus(w, f), rn = w.runs[f];
      return Object.assign({ hasChip: true, t: st.name, sr: ' (' + f + ')', m: st.text, hasLink: true, link: Object.assign({ label: (rn.st === 'prog' ? 'Continue ' : 'Open ') + f, aria: (rn.st === 'prog' ? 'Continue ' : 'Open ') + f + ', ' + E.t }, this.L(f === 'WEB' ? { s: 'web', exp: 'ste' } : { s: 'fmt', exp: 'ste', fmt: 'VR' })) }, st); });
    const keptAlt = () => ['WEB', 'VR'].map(f => { const c = this.fmtChip(w, f), rn = w.runs[f];
      const m = rn.st === 'done' ? 'Completed ' + this.nbd(this.dOnly(rn.done)) : rn.st === 'prog' ? 'In progress · ' + (f === 'WEB' ? 'last saved ' : 'last session ') + this.nbd(this.dOnly(rn.saved)) : 'Not started';
      return Object.assign({ hasChip: true, t: Component.FN[f], sr: ' (' + f + ')', m, hasLink: false, link: {} }, c); });
    const expAlt = () => [Object.assign({ hasChip: false, code: '', fmtCls: '', glyph: '', hasGlyph: false, t: E.t, sr: '', m: C.own + ' · ' + C.name, hasLink: true,
      link: Object.assign({ label: 'Open experiment', aria: 'Open experiment ' + E.t }, this.L({ s: 'hub', exp: 'ste', tab: 'overview' })) })];
    const showExps = this.current(w) && exp.id !== 'ste';
    const M = {
      notgiven: Object.assign({ crumbs: crumbC, crumb: 'Not available', k: exp.t, t: 'This experiment isn’t available to you', d: 'Your institution hasn’t given you ' + exp.t + '.' + (showExps ? '' : ' Experiments you can open are in My courses.'),
        altH: 'Experiments you can open', alt: showExps ? expAlt() : [], acts: [(showExps ? s : p)('Back to My courses', { s: 'courses', tab: 'courses' })], help: true }, ico('sti-block', 'off')),
      withdrawn: Object.assign({ crumbs: crumbC, crumb: 'Not available', k: exp.t, t: 'This experiment is no longer given to you', d: 'Your institution no longer gives you ' + exp.t + '. Your work is kept.',
        altH: 'Your work, as recorded', alt: keptAlt(), acts: earlier, help: true }, ico('sti-ended', 'off')),
      ended: Object.assign({ crumbs: crumbC, crumb: 'Not available', k: C.own + ' · ' + C.name, t: 'Your access to ' + exp.t + ' has ended', d: 'It ended on ' + this.nbd(w.endedOn) + '. Your earlier work is kept.',
        altH: 'Your work, as recorded', alt: keptAlt(), acts: earlier, help: true }, ico('sti-ended', 'off')),
      'course-none': Object.assign({ crumbs: crumbC, crumb: C.name, k: C.own + ' · ' + C.name, t: w.grant === 'none' ? 'This course isn’t available to you' : 'This course has no experiments for you right now', d: w.grant === 'none' ? 'Courses appear in My courses when your institution gives you an experiment in them.' : 'Your earlier work in it is kept in Progress.',
        altH: '', alt: [], acts: w.grant === 'none' ? [p('Back to My courses', { s: 'courses', tab: 'courses' })] : earlier, help: true }, ico('sti-book', 'off')),
      ar: Object.assign({ crumbs: crumbX, crumb: 'AR', k: E.t + ' · Simulation', t: 'AR isn’t included for your institution', d: 'AR is published for this experiment, but your institution’s access includes WEB and VR only.',
        altH: 'Formats you can use', alt: fmtAlt(), acts: [s('Back to Simulation', { s: 'hub', exp: 'ste', tab: 'simulation' })], help: false }, ico('sti-box')),
      mr: Object.assign({ crumbs: crumbX, crumb: 'MR', k: E.t + ' · Simulation', t: 'This experiment isn’t available in MR', d: E.t + ' is made for WEB, AR and VR.',
        altH: 'Formats you can use', alt: fmtAlt(), acts: [s('Back to Simulation', { s: 'hub', exp: 'ste', tab: 'simulation' })], help: false }, ico('sti-box', 'off')),
      'fb-not': Object.assign({ crumbs: [crumbX[0], Object.assign({ t: r.fmt || 'WEB' }, this.L(r.fmt === 'VR' ? { s: 'fmt', exp: 'ste', fmt: 'VR' } : { s: 'web', exp: 'ste' }))], crumb: 'Feedback', k: E.t + ' · Feedback',
        t: (r.fmt === 'WEB' || r.fmt === 'VR') ? 'Feedback on ' + r.fmt + ' isn’t open yet' : 'There’s no feedback for ' + r.fmt,
        d: (r.fmt === 'WEB' || r.fmt === 'VR') ? 'You can give feedback on ' + r.fmt + ' once ' + r.fmt + ' is recorded as completed. Each format has its own feedback.' : r.fmt + ' isn’t one of your formats for this experiment.',
        altH: '', alt: [], acts: [p('Back to ' + (r.fmt === 'VR' ? 'VR' : 'WEB'), r.fmt === 'VR' ? { s: 'fmt', exp: 'ste', fmt: 'VR' } : { s: 'web', exp: 'ste' })], help: false }, ico('sti-chat')),
      'dev-not': Object.assign({ crumbs: [], crumb: '', k: 'My device', t: 'My device isn’t available to you', d: 'It’s for students who use AR, VR or MR formats. None of your experiments uses them right now.', altH: '', alt: [], acts: [p('Back to Home', { s: 'home' })], help: true }, ico('sti-vr', 'off')),
      'asmt-none': Object.assign({ crumbs: [Object.assign({ t: 'Assessments' }, this.L({ s: 'alist', tab: 'todo' }))], crumb: 'Not available', k: 'Assessments', t: 'There’s no assessment here yet', d: 'Your faculty hasn’t set an assessment for this experiment yet. When they do, it appears in Assessments.', altH: '', alt: [], acts: [p('Back to Assessments', { s: 'alist', tab: 'todo' })], help: false }, ico('sti-clip', 'off')),
      inactive: Object.assign({ xs: true, crumbs: [], crumb: '', k: '', t: 'Your account is inactive', d: 'You can’t open experiments until your institution reactivates your account. Your work is kept.', altH: '', alt: [], acts: [p('Back to Home', { s: 'home' })], help: true }, xsIco('sti-user', 'paused')),
      nyw: Object.assign({ xs: true, crumbs: [], crumb: '', k: '', t: 'This page isn’t part of your workspace', d: 'You’re signed in to the Student workspace. This address belongs to a different workspace.', altH: '', alt: [], acts: [p('Back to Home', { s: 'home' })], help: true }, xsIco('sti-lock', 'off'))
    }[kind];
    M.hasCrumbs = M.crumbs.length > 0;
    M.xs = !!M.xs; M.st = !M.xs; M.hasK = !!M.k; M.hasAlt = M.alt.length > 0;
    return M;
  }
