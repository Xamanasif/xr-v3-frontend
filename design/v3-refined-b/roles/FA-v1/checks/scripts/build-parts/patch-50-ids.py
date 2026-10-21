# Owner decision (21 Oct 2026): keep internal technical IDs out of ordinary user-facing labels in Faculty, extending
# the Super Admin rule (owner decision 6) to this role. ASMT-, ATT-, Q- and D- identifiers are removed from visible
# text, placeholders, dialog titles, notices and accessible labels. Records are identified by their names, the student's
# name, the question's text or its position. Kept: academic course codes (ME ZG523) and institution-issued student IDs
# (GIT-2026-0418), which are not internal technical IDs. Stable keys stay in routing, element ids, the preview props,
# the CSV "student ID" column, the question search index and SCENARIOS.json. No business rule changes: versions,
# attempts, one-assessment-per-experiment, marking, release and import all behave exactly as before.

# ── 1 · assessment record band (FA-08…FA-12): the ASMT id leaves the meta line ─────────────────────────────
rep('<span class="{{ AR.stCls }}"><i></i>{{ AR.st }}</span><span class="fa-id">{{ AR.id }}</span>',
    '<span class="{{ AR.stCls }}"><i></i>{{ AR.st }}</span>')

# ── 2 · question rows keep type and marks, not the bank id (FA-09, FA-07 step 4) ───────────────────────────
rep('<span class="fr-qmeta-m">{{ r.marks }}</span><span class="fa-id">{{ r.id }}</span>',
    '<span class="fr-qmeta-m">{{ r.marks }}</span>')
rep('<span class="fr-qmeta-m">{{ p.marks }}</span><span class="fa-id">{{ p.id }}</span>',
    '<span class="fr-qmeta-m">{{ p.marks }}</span>')
rep('<p class="fa-row"><span class="{{ CW.doneCls }}"><i></i>{{ CW.doneLabel }}</span><span class="fa-id">{{ CW.asmId }}</span></p>',
    '<p class="fa-row"><span class="{{ CW.doneCls }}"><i></i>{{ CW.doneLabel }}</span></p>')

# ── 3 · marking sheet band (FA-19): the ATT id leaves the meta line ────────────────────────────────────────
rep('<span class="{{ MK.stCls }}"><i></i>{{ MK.st }}</span><span class="fa-id">{{ MK.attId }}</span><span class="rk-meta-sep" aria-hidden="true"></span>',
    '<span class="{{ MK.stCls }}"><i></i>{{ MK.st }}</span><span class="rk-meta-sep" aria-hidden="true"></span>')

# ── 4 · question bank (FA-14): the quiet line carries the version and, with several experiments, the experiment ──
rep('<span class="fa-id">{{ r.idv }}</span>',
    '<sc-if value="{{ r.hasIdv }}" hint-placeholder-val="{{ false }}"><span class="fa-id">{{ r.idv }}</span></sc-if>')
rep("idv: q.id + (q.v.length > 1 ? ' · version ' + q.v.length : '') + (exps.length > 1 ? ' · ' + this.expo(q.exp).t : ''),",
    "idv: [q.v.length > 1 ? 'Version ' + q.v.length : '', exps.length > 1 ? this.expo(q.exp).t : ''].filter(Boolean).join(' · '), hasIdv: q.v.length > 1 || exps.length > 1,")
rep('<li><span class="fa-id">{{ d.id }}</span> {{ d.t }} — {{ d.when }}</li>', '<li>{{ d.t }} — {{ d.when }}</li>')
rep('placeholder="Words or question ID"', 'placeholder="Words in the question"')
rep('Try fewer filters, other words, or a question ID such as Q-0104.', 'Try fewer filters or other words.')
rep('<span>Only what you add goes into your bank and gets a question ID.</span>',
    '<span>Only what you add goes into your bank.</span>')
rep('<span>An added draft gets a question ID and can be used in your assessments.</span>',
    '<span>An added draft can be used in your assessments.</span>')
rep("added: q.added, editAria: 'Edit ' + q.id, delAria: 'Delete ' + q.id, delId: 'fa-qb-del-' + q.id,",
    "added: q.added, editAria: 'Edit question: ' + v.t, delAria: 'Delete question: ' + v.t, delId: 'fa-qb-del-' + q.id,")
rep("this.DG = { open: true, title: 'Delete ' + id + '?', desc: this.qv(id).t,",
    "this.DG = { open: true, title: 'Delete this question?', desc: this.qv(id).t,")
rep("this.F.bank = { t: id + ' deleted from your question bank.', d: 'Its history is kept.'",
    "this.F.bank = { t: 'Question deleted from your question bank.', d: 'Its history is kept.'")
rep("this.F.bank = { t: 'Q-0101 deleted from your question bank.', d: 'Its history is kept.",
    "this.F.bank = { t: 'Question deleted from your question bank.', d: 'Its history is kept.")

# ── 5 · question editor (FA-15): the meta line and the side facts show the version, not the id ─────────────
rep("hasIdText: !!q0, idText: q0 ? q0.id + (q0.v.length > 1 ? ' · version ' + q0.v.length : '') : '',",
    "hasIdText: !!(q0 && q0.v.length > 1), idText: q0 && q0.v.length > 1 ? 'Version ' + q0.v.length : '',")
rep("[{ k: 'Question ID', v: 'Given when you add it to your bank', cls: 'is-quiet' }, { k: 'Used in', v: 'Not in an assessment yet', cls: 'is-quiet' }]",
    "[{ k: 'Used in', v: 'Not in an assessment yet', cls: 'is-quiet' }]")
rep("[{ k: 'Question ID', v: 'Given when you save', cls: 'is-quiet' }, { k: 'Used in', v: 'Not in an assessment yet', cls: 'is-quiet' }]",
    "[{ k: 'Used in', v: 'Not in an assessment yet', cls: 'is-quiet' }]")
rep("t = 'Saved to your question bank as ' + id + '.';", "t = 'Saved to your question bank.';")
rep("t = 'Saved as version ' + q.v.length + ' of ' + q.id + '.';", "t = 'Saved as version ' + q.v.length + '.';")
rep("t = q.id + ' saved.';", "t = 'Question saved.';")
rep("'Added to your question bank as ' + id + '.'", "'Added to your question bank.'", 3)

# ── 6 · import (FA-17): the ids assigned are no longer listed in the finished notice ───────────────────────
rep("' added to your bank as ' + (ids.length === 1 ? ids[0] : ids[0] + ' to ' + ids[ids.length - 1]) + '. None is in an assessment yet.'",
    "' added to your bank. None is in an assessment yet.'")

# ── 7 · submissions and marking queue (FA-12, FA-18): attempt instead of the ATT id ────────────────────────
rep("sub: t.id + ' · attempt ' + t.no + ' of ' + cfgT.att + (multi ? ' · version ' + t.ver : ''),",
    "sub: 'Attempt ' + t.no + ' of ' + cfgT.att + (multi ? ' · version ' + t.ver : ''),")
rep("return { who: s.n, sub: t.id + ' · attempt ' + t.no + ' of ' + cfg.att,",
    "return { who: s.n, sub: 'Attempt ' + t.no + ' of ' + cfg.att,")
rep("aria: (w ? 'Mark ' : 'View marks for ') + s.n + ', ' + t.id,", "aria: (w ? 'Mark ' : 'View marks for ') + s.n,", 2)
rep("b.expT = 'Exported submissions-' + a.id + '.csv · '", "b.expT = 'Exported submissions-' + this.slug(a.name || 'assessment') + '.csv · '")
rep("expT: 'Exported submissions-' + a.id + '.csv · '", "expT: 'Exported submissions-' + this.slug(a.name || 'assessment') + '.csv · '")
rep("this.DG = { open: true, title: 'Confirm marks for ' + s.n + '?', desc: (a.name || 'Untitled draft') + ' · ' + t.id,",
    "this.DG = { open: true, title: 'Confirm marks for ' + s.n + '?', desc: a.name || 'Untitled draft',")

# ── 8 · the assessment panel on FA-05 and FA-21: attempt instead of the ATT id ─────────────────────────────
rep("t ? t.id + ' · attempt ' + t.no + ' of ' + this.verOf(a, t.ver).att + ' · submitted ' + t.submitted : ''",
    "t ? 'Attempt ' + t.no + ' of ' + this.verOf(a, t.ver).att + ' · submitted ' + t.submitted : ''")

# ── 9 · choosing and ordering questions (FA-07 step 3, FA-09): text, type and position carry the identity ──
rep("t: v.t, sub: q.id + ' · ' + Component.TYPES[v.type] + ' · ' + this.plural(v.marks, 'mark'), checked: !!c.qsel[q.id]",
    "t: v.t, sub: Component.TYPES[v.type] + ' · ' + this.plural(v.marks, 'mark'), checked: !!c.qsel[q.id]")
rep("return { t: v.t, sub: b.id + ' · ' + Component.TYPES[v.type] + ' · ' + this.plural(v.marks, 'mark'), aria: 'Add ' + b.id + ' to this assessment',",
    "return { t: v.t, sub: Component.TYPES[v.type] + ' · ' + this.plural(v.marks, 'mark'), aria: 'Add to this assessment: ' + v.t,")
rep("after(made, b.id + ' added as question ' + this.cur(a).qs.length + '.');",
    "after(made, 'Added as question ' + this.cur(a).qs.length + '.');")
rep("U.aq.msg = id + ' added as question ' + this.cur(a).qs.length + '.';",
    "U.aq.msg = 'Added as question ' + this.cur(a).qs.length + '.';")
rep("msg: 'Q-0103 added as question 5.'", "msg: 'Added as question 5.'")
rep("offer: { label: 'Add ' + id + ' to this assessment', add: () => this.offerAdd(a, id) }",
    "offer: { label: 'Add this question to the assessment', add: () => this.offerAdd(a, id) }")
rep("rmAria: 'Remove question ' + (i + 1) + ', ' + x.id + ', from this assessment', updAria: 'Use the updated version of ' + x.id,",
    "rmAria: 'Remove question ' + (i + 1) + ' from this assessment', updAria: 'Use the updated version of question ' + (i + 1),")
rep("after(made, x.id + ' removed from this assessment. It is still in your question bank.');",
    "after(made, 'Question removed from this assessment. It is still in your question bank.');")
rep("after(made, x.id + ' now uses the version in your bank.');",
    "after(made, 'Question ' + (i + 1) + ' now uses the version in your bank.');")

# ── 10 · assessments list (FA-06): the row's quiet line carries only who created a colleague's assessment ──
rep("sub: a.id + (own ? '' : ' · created by ' + this.person(a.by).name),",
    "sub: own ? '' : 'Created by ' + this.person(a.by).name, hasSub: !own,")
rep('<a class="rk-rowlink" href="#FA-08" onClick="{{ r.openLink }}" aria-label="{{ r.aria }}">{{ r.name }}</a><span class="fa-cellsub">{{ r.sub }}</span>',
    '<a class="rk-rowlink" href="#FA-08" onClick="{{ r.openLink }}" aria-label="{{ r.aria }}">{{ r.name }}</a><sc-if value="{{ r.hasSub }}" hint-placeholder-val="{{ false }}"><span class="fa-cellsub">{{ r.sub }}</span></sc-if>')

# ── 11 · the remaining action messages name the position or the question, not the id ───────────────────────
rep("after(made, 'Moved ' + id + ' to position ' + (j + 1) + '.', 'fa-aq-' + id)",
    "after(made, 'Moved question ' + (i + 1) + ' to position ' + (j + 1) + '.', 'fa-aq-' + id)")
rep("U.cw.msg = id + ' saved to your question bank.'", "U.cw.msg = 'Saved to your question bank.'")
rep("msg: id + ' saved to your question bank.', msgD: 'It isn’t in this assessment yet.",
    "msg: 'Saved to your question bank.', msgD: 'It isn’t in this assessment yet.")

# ── 12 · FA-16: an added draft collapses to a bank line that says it is in the bank, not its new id ────────
rep("meta: (added ? x.bankId + ' · ' : '') + Component.TYPES[q.type] + ' · ' + this.plural(q.marks, 'mark'),",
    "meta: (added ? 'In your question bank · ' : '') + Component.TYPES[q.type] + ' · ' + this.plural(q.marks, 'mark'),")
