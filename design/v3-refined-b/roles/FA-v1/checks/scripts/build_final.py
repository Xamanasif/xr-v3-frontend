# Build the FINAL complete-role Main.dc.html from the R1 checkpoint Main (R1-Main.dc.html) plus the final parts.
# Every owned screen that the final pass redesigns is spliced in from parts/; view-model additions are patched below.
import os, re, sys
FIN = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.join(FIN, 'project')
PARTS = os.path.join(FIN, 'parts')
src = open(os.path.join(FIN, 'R1-Main.dc.html'), encoding='utf-8').read()
t = src

def rep(old, new, count=1):
    global t
    n = t.count(old)
    if n != count:
        sys.exit('expected %d match(es), found %d for: %r' % (count, n, old[:140]))
    t = t.replace(old, new)

def splice(start_marker, end_marker, new_text):
    global t
    a = t.find(start_marker)
    if a < 0: sys.exit('start marker not found: ' + start_marker)
    b = t.find(end_marker, a + len(start_marker))
    if b < 0: sys.exit('end marker not found: ' + end_marker)
    t = t[:a] + new_text + t[b:]

part = lambda n: open(os.path.join(PARTS, n), encoding='utf-8').read()
have = lambda n: os.path.exists(os.path.join(PARTS, n))

# 0 · title
rep('<title>Faculty — visual refinement R1 (live role preview)</title>', '<title>Faculty — XR Learning Platform (live role preview)</title>')

# 1 · templates
splice('        <sc-if value="{{ CR.isE }}" hint-placeholder-val="{{ false }}">', '      </div>\n      </sc-if>\n\n      <!-- ═══ FA-03 Course', part('fa04.html'))
splice('      <!-- ═══ FA-05 Experiment', '      <!-- ═══ FA-06 Assessments', part('fa05.html'))
splice('      <!-- ═══ FA-06 Assessments', '      <!-- ═══ FA-07 Create', part('fa06.html'))
splice('      <!-- ═══ FA-07 Create', '      <!-- ═══ FA-08…FA-12', part('fa07.html'))
splice('      <!-- ═══ FA-08…FA-12', '      <!-- ═══ FA-14 Question bank', part('fa08.html'))
if have('fa14.html'): splice('      <!-- ═══ FA-14 Question bank', '      <!-- ═══ FA-15 Add / edit question', part('fa14.html'))
if have('fa15.html'): splice('      <!-- ═══ FA-15 Add / edit question', '      <!-- ═══ FA-16 Draft questions', part('fa15.html'))
if have('fa17.html'): splice('      <!-- ═══ FA-17 Import questions', '      <!-- ═══ FA-18 Marking queue', part('fa17.html'))
if have('fa18.html'): splice('      <!-- ═══ FA-18 Marking queue', '      <!-- ═══ FA-19 Mark a submission', part('fa18.html'))
if have('fa20.html'): splice('      <!-- ═══ FA-20 Students', '      <!-- ═══ FA-21 Student detail', part('fa20.html'))
if have('fa21.html'): splice('      <!-- ═══ FA-21 Student detail', '      <!-- ═══ XS-07 Help', part('fa21.html'))

# 2 · logic: shared assessment summary, FA-03 (uses it) and FA-05
splice('  /* ══════════ FA-03 Course (R1: identity band · one panel per experiment) ══════════ */', '  /* ══════════ XS-07 Help (borrowed) and message pages ══════════ */', part('logic-asm.js'))

# 3 · logic: FA-04 Experiments tab rows (per-format meters, assessment cell)
rep("""      return { t: e.t, course: c.code + ' · ' + c.t, fm: e.held, fmAria: 'Formats your institution has: ' + e.held.join(', '),
        done: this.fmCounts(e.id).map(f => f.code + ': ' + f.done + ' of ' + n + ' completed'),
        stCls: st.cls, stLabel: st.label, asm: a ? (a.name || 'Untitled draft') : 'Create one from the experiment page', aria: 'Open ' + e.t, open, openLink: ev => { if (ev) { ev.preventDefault(); ev.stopPropagation(); } open(); } };""",
"""      const cfg = a ? this.cur(a) : null;
      return { t: e.t, course: c.code + ' · ' + c.t, fm: e.held, fmAria: 'Formats your institution has: ' + e.held.join(', '),
        hasStu: n > 0, noStu: !n, prog: n ? this.fmProg(e.id) : [], progAria: 'Student activity by format for ' + e.t + ', as of ' + W.clock.day, reach: this.plural(n, 'student') + ' with access · as of ' + W.clock.day,
        stCls: st.cls, stLabel: st.label, hasAsm: !!a, asm: a ? (a.name || 'Untitled draft') : '',
        asmD: a ? (cfg.dl ? 'Due ' + cfg.dl : 'No deadline set yet') + (this.own(a) ? '' : ' · created by ' + this.person(a.by).name) : 'Create one from the experiment page.',
        aria: 'Open ' + e.t, open, openLink: ev => { if (ev) { ev.preventDefault(); ev.stopPropagation(); } open(); } };""")

# 4 · logic: FA-06 rows (deadline cell with days left, submissions meter)
rep("""      const e = this.expo(a.exp), cr = this.course(e.crs), cfg = this.cur(a), st = this.asmState(a), own = this.own(a), ready = this.isReady(a);
      const subs = this.attsOf(a.id).filter(t => t.submitted).length, w = own ? this.attsOf(a.id).filter(t => this.waiting(t)).length : 0, ss = this.stuOf(e.id).length;
      const open = () => this.go({ s: 'FA-08', a: a.id });
      return { name: a.name || 'Untitled draft', sub: a.id + (own ? '' : ' · created by ' + this.person(a.by).name), exp: e.t, code: cr.code + ' · ' + cr.t,
        due: cfg.dl ? 'Due ' + cfg.dl : 'No deadline yet', subs: !own ? 'Submissions aren’t shown to co-teachers yet' : ready ? subs + ' of ' + ss + ' students submitted' : (cfg.qs.length ? 'Rules not finished' : 'No questions yet') + ' · students can’t see it',""",
"""      const e = this.expo(a.exp), cr = this.course(e.crs), cfg = this.cur(a), st = this.asmState(a), own = this.own(a), ready = this.isReady(a);
      const subL = this.attsOf(a.id).filter(t => t.submitted), subs = subL.length, w = own ? this.attsOf(a.id).filter(t => this.waiting(t)).length : 0, ssL = this.stuOf(e.id), ss = ssL.length;
      const iso = this.parseWhen(cfg.dl), days = iso ? Math.round((this.utc(iso) - this.utc(W.clock.iso)) / 86400000) : 0, past = !!iso && this.nowIso() > iso;
      const su = this.unitsOf(ssL.map(s => subL.some(t => t.st === s.id) ? 'is-sub' : '').sort((x, y) => (y ? 1 : 0) - (x ? 1 : 0))), meter = own && ready && ss > 0;
      const open = () => this.go({ s: 'FA-08', a: a.id });
      return { name: a.name || 'Untitled draft', sub: a.id + (own ? '' : ' · created by ' + this.person(a.by).name), exp: e.t, code: cr.code + ' · ' + cr.t,
        due: cfg.dl || 'Not set yet', hasLeft: !!iso && !past && ready, left: days === 0 ? 'Due today' : this.plural(days, 'day') + ' left', hasDueNote: past, dueNote: 'Deadline passed',
        showSubs: meter, noMeter: !meter, subsUnits: su.units, subsCls: su.cls,
        subs: !own ? 'Submissions aren’t shown to co-teachers yet' : ready ? subs + ' of ' + ss + ' students submitted' : (cfg.qs.length ? 'Rules not finished' : 'No questions yet') + ' · students can’t see it',""")

# 5 · logic: FA-07 create (experiment cards, step summary, create panel)
rep("""      exps: this.myExps().map(e => { const cr = this.course(e.crs), ea = this.asmOf(e.id); return { id: 'fa-cw-e-' + e.id, t: e.t, d: cr.code + ' · ' + cr.t + ' · ' + (ea ? 'Already has an assessment: ' + (ea.name || 'Untitled draft') : 'No assessment yet'), checked: c.exp === e.id, pick: () => set({ exp: e.id, errs: {} }) }; }),""",
"""      exps: this.myExps().map(e => { const cr = this.course(e.crs), ea = this.asmOf(e.id), ns = this.stuOf(e.id).length; return { id: 'fa-cw-e-' + e.id, t: e.t, d: cr.code + ' · ' + cr.t + ' · ' + (ea ? 'Already has an assessment: ' + (ea.name || 'Untitled draft') : 'No assessment yet'), checked: c.exp === e.id, pick: () => set({ exp: e.id, errs: {} }),
        fm: e.held, fmAria: 'Formats your institution has: ' + e.held.join(', '), reach: ns ? this.plural(ns, 'student') + ' with access' : 'No students with access yet' }; }),""")
rep("""      preview: picked.map((q, i) => { const v = this.qv(q.id); return { n: String(i + 1), t: v.t, type: Component.TYPES[v.type], marks: this.plural(v.marks, 'mark'), id: q.id }; }),""",
"""      preview: picked.map((q, i) => { const v = this.qv(q.id); return { n: String(i + 1), t: v.t, type: Component.TYPES[v.type], typeCls: this.typeCls(v.type), marks: this.plural(v.marks, 'mark'), id: q.id }; }),
      introCls: 'fr-introtext' + (c.intro.trim() ? '' : ' is-quiet'),
      layoutCls: c.step === 5 ? 'fr-author fr-author--one' : 'fr-author', sideH: c.step === 4 ? 'When you create it' : 'This assessment',
      showSum: c.step < 4, showCreate: c.step === 4,
      createList: ['Students who have ' + (ex ? ex.t : 'the experiment') + ' can see it in Assessments and start it.', 'Choice questions are marked automatically; you mark written answers.', 'You can change it later from its tabs. A change after students submit makes a new version.'],
      sumList: [{ k: 'Experiment', v: ex ? ex.t : 'Not chosen yet', ok: !!ex }, { k: 'Name', v: c.name.trim() || 'Not named yet', ok: !!c.name.trim() },
        { k: 'Rules', v: ruleBits.join(' · ') || 'Not set yet', ok: this.rulesOk({ pass: c.pass, att: c.att, dl: c.dl, rel: c.rel, reldate: c.reldate }) },
        { k: 'Questions', v: picked.length ? this.plural(picked.length, 'question') + ' · ' + this.plural(marks, 'mark') : 'None yet', ok: picked.length > 0 }].map(s => Object.assign(s, { cls: 'fr-sum-i' + (s.ok ? ' is-done' : ''), sr: s.ok ? ' (done)' : ' (not done yet)' })),""")

# 6 · logic: FA-08…FA-12 record (band figures, summary panel list) — whole method
splice('  vmRecord(nav) {', '  vmQuestionsTab(a) {', part('logic-record.js'))

# 7 · logic: FA-09 questions (type tags, order group, marking split)
rep("""      return { n: String(i + 1), rid: 'fa-aq-' + x.id, t: v.t, type: Component.TYPES[v.type], marks: this.plural(v.marks, 'mark'), id: x.id + (bq && bq.v.length > 1 ? ' · version ' + x.v : ''),""",
"""      return { n: String(i + 1), rid: 'fa-aq-' + x.id, t: v.t, type: Component.TYPES[v.type], typeCls: this.typeCls(v.type), orderAria: 'Order of question ' + (i + 1), marks: this.plural(v.marks, 'mark'), id: x.id + (bq && bq.v.length > 1 ? ' · version ' + x.v : ''),""")
rep("""    const vn = this.verNote(a), pinned = this.subsOn(a, cfg.n);
    return { layout: q.panel ? 'rk-detail' : 'fa-single', panel: q.panel && own, noPanel: !q.panel,""",
"""    const vn = this.verNote(a), pinned = this.subsOn(a, cfg.n);
    const nW = cfg.qs.filter(x => { const v = this.qv(x.id, x.v); return v && v.type === 'w'; }).length, nA = cfg.qs.length - nW;
    return { layout: q.panel ? 'rk-detail' : 'fa-single', panel: q.panel && own, noPanel: !q.panel,
      hasSplit: cfg.qs.length > 0, split: nA + ' marked automatically · ' + this.plural(nW, 'written answer') + ' you mark',""")

# 8 · logic: FA-10 settings (one warning group)
rep("""      save, busy: !!f.busy, notBusy: !f.busy, cancel: () => { U.st = this.stFrom(a); this.bump(); this.focusLater('fa-st-name'); } };""",
"""      hasWarn: pinned.length > 0 && (ruleChanged || relChanged) && !f.saved,
      save, busy: !!f.busy, notBusy: !f.busy, cancel: () => { U.st = this.stFrom(a); this.bump(); this.focusLater('fa-st-name'); } };""")

# 9 · logic: FA-12 rows (score so far for waiting rows, short release status)
rep("""        st: w ? 'Waiting for marking' : 'Marked', stCls: w ? 'xr-st xr-st--warn' : 'xr-st xr-st--ok', score: w ? '—' : sc.total + ' of ' + sc.of, hasOutcome: !w, outcome: (sc.passed ? 'Passed' : 'Not passed') + ' · pass mark ' + sc.pm,
        rel: rel.text, relDone: rel.done, relNot: !rel.done,""",
"""        st: w ? 'Waiting for marking' : 'Marked', stCls: w ? 'xr-st xr-st--warn' : 'xr-st xr-st--ok', score: w ? '—' : sc.total + ' of ' + sc.of, hasOutcome: !w, outcome: (sc.passed ? 'Passed' : 'Not passed') + ' · pass mark ' + sc.pm,
        autoPart: '— of ' + sc.of, autoNote: 'Marked automatically: ' + sc.auto + ' of ' + sc.autoOf,
        rel: rel.text, relDone: rel.done, relNot: !rel.done, relHead: rel.done ? 'Released' : 'Not yet', relSub: rel.done ? rel.text.replace(/^Released /, '') : rel.text.replace(/^Not yet — /, ''),""")

# 10 · later batches add their own patches from logic-*.py files
for f in sorted(os.listdir(PARTS)):
    if f.startswith('patch-') and f.endswith('.py'):
        exec(open(os.path.join(PARTS, f), encoding='utf-8').read())

# The build writes the PRE-consolidation state to final/pre/ (fr- names, published fa.css + fa-r1.css);
# consolidate.py then writes the single-stylesheet role into final/project/.
import shutil
PRE = os.path.join(FIN, 'pre'); os.makedirs(PRE, exist_ok=True)
open(os.path.join(PRE, 'Main.dc.html'), 'w', encoding='utf-8').write(t)
# role stylesheet during the build: R1 rules + final rules (consolidated into one file at the end)
css = open(os.path.join(FIN, 'fa-r1-base.css'), encoding='utf-8').read() + '\n' + open(os.path.join(PARTS, 'final.css'), encoding='utf-8').read()
open(os.path.join(PRE, 'fa-r1.css'), 'w', encoding='utf-8').write(css)
shutil.copyfile(os.path.join(FIN, 'fa-published.css'), os.path.join(PRE, 'fa.css'))
for c in ('core.css', 'rb.css', 'rb-kit.css'):
    shutil.copyfile(os.path.join(PROJ, c), os.path.join(PRE, c))
print('pre/Main.dc.html written', len(t), 'bytes; pre/fa-r1.css', len(css), 'bytes')
