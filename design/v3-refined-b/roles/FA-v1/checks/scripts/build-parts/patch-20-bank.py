# FA-14 Question bank: type tags, compact "Used in", draft cards with the answer, a split of the bank by type
rep("""      return { t: v.t, sub: q.id + ' · ' + Component.TYPES[v.type] + (q.v.length > 1 ? ' · version ' + q.v.length : '') + (exps.length > 1 ? ' · ' + this.expo(q.exp).t : ''),
        fromDraft: !!q.fromDraft, marks: this.plural(v.marks, 'mark'),""",
"""      return { t: v.t, sub: q.id + ' · ' + Component.TYPES[v.type] + (q.v.length > 1 ? ' · version ' + q.v.length : '') + (exps.length > 1 ? ' · ' + this.expo(q.exp).t : ''),
        type: Component.TYPES[v.type], typeCls: this.typeCls(v.type), idv: q.id + (q.v.length > 1 ? ' · version ' + q.v.length : '') + (exps.length > 1 ? ' · ' + this.expo(q.exp).t : ''),
        usedMain: use.cur.length ? this.names(use.cur) : use.ever ? 'None now' : 'Not yet', usedCls: use.cur.length ? 'fr-cellname' : 'fa-quiet',
        usedNote: use.cur.length ? '' : use.ever ? 'Earlier assessment versions keep it' : '', hasUsedNote: !use.cur.length && use.ever,
        fromDraft: !!q.fromDraft, marks: this.plural(v.marks, 'mark'),""")
rep("""    const dcards = drafts.map(d => ({ rid: 'fa-qb-d-' + d.id, t: d.q.t, meta: this.draftMeta(d),""",
"""    const dcards = drafts.map(d => ({ rid: 'fa-qb-d-' + d.id, t: d.q.t, meta: this.draftMeta(d),
      showOpts: d.q.type === 'sc', opts: (d.q.opts || []).map((o, i) => ({ l: 'ABCD'[i], t: o, key: i === d.q.correct, cls: 'fr-dopt' + (i === d.q.correct ? ' is-key' : '') })).filter(o => String(o.t).trim()),
      showTf: d.q.type === 'tf', tfAns: d.q.tf === 'true' ? 'True' : 'False', showGuide: d.q.type === 'w' && !!d.q.guide, guide: d.q.guide,""")
rep("""      drafts: dcards, hasDrafts: dcards.length > 0, noDrafts: !dcards.length, draftCount: this.plural(dcards.length, 'draft') + ' to review'""",
"""      drafts: dcards, hasDrafts: dcards.length > 0, noDrafts: !dcards.length, draftCount: this.plural(dcards.length, 'draft') + ' to review',
      split: (() => { const c = { sc: 0, tf: 0, w: 0 }; live.forEach(q => { c[this.qv(q.id).type] += 1; }); return [c.sc ? c.sc + ' single choice' : '', c.tf ? c.tf + ' true or false' : '', c.w ? this.plural(c.w, 'written answer') : ''].filter(Boolean).join(' · '); })()""")

# FA-15 editor: side facts (ID and version, where it is used, where it came from); one top message block
rep("""    const L = 'ABCD', q0 = f.mode === 'edit' ? this.bq(f.qid) : null;""",
"""    const L = 'ABCD', q0 = f.mode === 'edit' ? this.bq(f.qid) : null;
    const use0 = q0 ? this.qUse(q0) : null;
    const facts = f.mode === 'edit' && q0 ? [{ k: 'Version', v: 'Version ' + q0.v.length + (q0.v.length > 1 ? ' — earlier versions are kept' : ''), cls: '' }, { k: 'Used in', v: use0.cur.length ? this.names(use0.cur) : use0.ever ? 'Earlier assessment versions only' : 'Not in an assessment yet', cls: use0.cur.length ? '' : 'is-quiet' }, { k: 'Added', v: q0.added + (q0.fromDraft ? ' · from a draft you reviewed' : ''), cls: '' }]
      : f.mode === 'draft' && d ? [{ k: 'Question ID', v: 'Given when you add it to your bank', cls: 'is-quiet' }, { k: 'Used in', v: 'Not in an assessment yet', cls: 'is-quiet' }]
      : [{ k: 'Question ID', v: 'Given when you save', cls: 'is-quiet' }, { k: 'Used in', v: 'Not in an assessment yet', cls: 'is-quiet' }];""")
rep("""      save, busy: !!f.busy, notBusy: !f.busy, saveLabel: f.mode === 'draft' ? 'Add to bank' : 'Save question'""",
"""      hasTop: errList.length > 0 || !!f.note || f.mode === 'draft' || !!used, noType: !f.type, facts,
      save, busy: !!f.busy, notBusy: !f.busy, saveLabel: f.mode === 'draft' ? 'Add to bank' : 'Save question'""")

# FA-17 import: summary figures for the row check, the confirm step by type, single column when done
rep("""      hasErrors: !!(rep && rep.errors), hasWarn: !!(rep && rep.warnings), hasProblems: !!(rep && rep.problems.length),""",
"""      hasErrors: !!(rep && rep.errors), hasWarn: !!(rep && rep.warnings), hasProblems: !!(rep && rep.problems.length),
      nTotal: rep ? String(rep.total) : '0', nOk: rep ? String(rep.ok) : '0', nErr: rep ? String(rep.errors) : '0', nWarn: rep ? String(rep.warnings) : '0',
      errFigCls: rep && rep.errors ? 'is-err' : 'is-none', warnFigCls: rep && rep.warnings ? 'is-warn' : 'is-none',
      byType: rep ? [['sc', 'Single choice'], ['tf', 'True or false'], ['w', 'Written answer']].map(x => ({ k: x[1], v: String(rep.items.filter(it => it.type === x[0]).length) })).filter(x => x.v !== '0') : [],
      layoutCls: m.done ? 'fr-author fr-author--one' : 'fr-author',""")
