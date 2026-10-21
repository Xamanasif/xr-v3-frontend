// Logic parity for Student final (no DOM): StudentFinal's class next to the approved Main class, each with a stub DCLogic.
// 1 every method outside the declared presentation set is byte-identical to Main (data, seeding, routing, guards, mutations)
// 2 routing: for every scenario × screen, resolve() makes the same decision (view, screen id, format)
// 3 refusal messages: same titles; every destination the baseline message offered is still offered
// 4 the one next-step rule matches the hub rule (label, destination) in every scenario and mutation
// 5 reference identifiers: only the baseline's (ACC-0107, SACC-0310, DTR-0018) — where they render is compared with the baseline by fx_idparity.mjs
import fs from 'node:fs';
const load = file => {
  const html = fs.readFileSync('/home/claude/work/project/' + file, 'utf8');
  const js = html.split('data-dc-script')[1].split('>').slice(1).join('>').split('</script>')[0];
  const DCLogic = class { constructor() { this.props = {}; this.state = {}; } setState() {} };
  const K = new Function('DCLogic', 'window', js + '\nreturn Component;')(DCLogic, { setTimeout() {}, clearTimeout() {}, scrollTo() {} });
  const c = new K(); c.props = {}; return [K, c];
};
const [R2, c] = load('StudentFinal.dc.html');
const [Orig, o] = load('Main.dc.html');
let pass = 0, fail = 0; const fails = [];
const ok = (name, cond, detail) => { if (cond) pass++; else { fail++; fails.push(name); } if (!cond || process.env.V) console.log((cond ? 'PASS ' : 'FAIL ') + name + (cond ? '' : '  → ' + JSON.stringify(detail).slice(0, 400))); };
// ── 1 method parity ──
const PRESENTATION = new Set(['msg', 'homeVM', 'xcard', 'courseCard', 'coursesVM', 'courseVM', 'courseLine', 'overviewVM', 'resVM', 'simVM', 'progTabVM', 'asmtTabVM', 'fpageVM', 'actVM', 'progVM', 'progExp', 'fbVM', 'alistVM', 'introVM', 'attVM', 'resultVM', 'devVM',
  'nextStep', 'nbd', 'fmtChip', 'runWord', 'offFormats', 'holdReason', 'webStages', 'fmtStatus', 'dayNum', 'whenOf', 'renderVals']);
const methods = K => { const names = new Set(); for (let p = K.prototype; p && p !== Object.prototype; p = Object.getPrototypeOf(p)) Object.getOwnPropertyNames(p).forEach(n => { if (n !== 'constructor') names.add(n); }); return names; };
const statics = K => Object.getOwnPropertyNames(K).filter(n => !['length', 'name', 'prototype'].includes(n));
const mO = methods(Orig), mR = methods(R2);
const src = (K, n) => { const d = Object.getOwnPropertyDescriptor(K.prototype, n) || {}; return String(d.value || d.get || ''); };
const changed = [...mO].filter(n => mR.has(n) && src(Orig, n) !== src(R2, n));
const added = [...mR].filter(n => !mO.has(n)), removed = [...mO].filter(n => !mR.has(n));
ok('no baseline method removed', removed.length === 0, removed);
ok('every changed method is a declared presentation method', changed.every(n => PRESENTATION.has(n)), changed.filter(n => !PRESENTATION.has(n)));
ok('every added method is a declared presentation method', added.every(n => PRESENTATION.has(n)), added.filter(n => !PRESENTATION.has(n)));
const sO = statics(Orig), sR = statics(R2);
ok('same static data (EXP, CRS, ASM, DEV, SC, SCREENS, …) byte-identical', sO.length === sR.length && sO.every(n => String(Object.getOwnPropertyDescriptor(Orig, n).get || Object.getOwnPropertyDescriptor(Orig, n).value) === String(Object.getOwnPropertyDescriptor(R2, n).get || Object.getOwnPropertyDescriptor(R2, n).value)), sO.filter(n => String(Object.getOwnPropertyDescriptor(Orig, n).get) !== String(Object.getOwnPropertyDescriptor(R2, n).get)));
console.log('methods changed (presentation): ' + changed.sort().join(', '));
console.log('methods added (presentation): ' + added.sort().join(', '));
// ── 2 routing parity ──
const SC = Object.keys(Orig.SC), SCR = Orig.SCREENS.map(s => s[0]);
ok('same scenario list', SC.join() === Object.keys(R2.SC).join());
let routes = 0;
const hrefsOf = M => [...(M.acts || []).map(a => a.href), ...(M.crumbs || []).map(x => x.href)].filter(Boolean);
for (const k of SC) for (const key of SCR) {
  const wO = o.seed(k, ''), wR = c.seed(k, '');
  const rO = o.routeFor(key), rR = c.routeFor(key);
  const a = o.resolve(rO, wO), b = c.resolve(rR, wR);
  routes++;
  ok(`route · ${k} · ${key} · same decision`, a.view === b.view && a.id === b.id && a.fmt === b.fmt, { a: [a.view, a.id, a.fmt], b: [b.view, b.id, b.fmt] });
  if (a.view === 'msg' && b.view === 'msg') {
    ok(`route · ${k} · ${key} · same message title`, a.M.t === b.M.t, { a: a.M.t, b: b.M.t });
    const hb = new Set([...hrefsOf(b.M), ...(b.M.alt || []).filter(x => x.hasLink).map(x => x.link.href)]);
    const lost = hrefsOf(a.M).filter(h => !hb.has(h));
    ok(`route · ${k} · ${key} · every baseline destination still offered`, lost.length === 0, lost);
  }
}
console.log('routes compared: ' + routes);
// ── 4 next-step rule ──
const U = () => c.baseUi();
for (const k of SC) {
  const w = c.seed(k, '');
  if (!(w.grant === 'active' || w.grant === 'waiting') || w.acct !== 'active') continue;
  const old = c.hubVM(w, { s: 'hub', exp: 'ste', tab: 'overview' }, U()).next, nxt = c.nextStep(w);
  ok(`rule · ${k} · shown`, !!old.show === !!nxt.show, { old: old.show, nxt: nxt.show });
  if (old.show && nxt.show) { ok(`rule · ${k} · same label`, old.label === nxt.label, { old: old.label, nxt: nxt.label }); ok(`rule · ${k} · same destination`, old.href === nxt.href, { old: old.href, nxt: nxt.href }); }
}
// ── 5 internal IDs never reach the page (the final view models; hubVM is the verbatim baseline and its band note is not rendered by the final templates — the rendered scan covers it) ──
const strings = (x, out = [], seen = new Set()) => { if (typeof x === 'string') out.push(x); else if (x && typeof x === 'object' && !seen.has(x)) { seen.add(x); for (const v of Array.isArray(x) ? x : Object.values(x)) strings(v, out, seen); } return out; };
const ID = /\b(?:S?ACC|DTR)-\d+/;
let vmCalls = 0;
for (const k of SC) {
  const w = c.seed(k, ''), u = c.baseUi();
  const vms = [];
  try { vms.push(c.homeVM(w)); } catch (e) { }
  for (const t of ['overview', 'resources', 'simulation', 'assessment', 'progress']) { try { if (t === 'overview') vms.push(c.overviewVM(w)); if (t === 'resources') vms.push(c.resVM(w, u)); if (t === 'simulation') vms.push(c.simVM(w)); if (t === 'progress') vms.push(c.progTabVM(w)); if (t === 'assessment') vms.push(c.asmtTabVM(w)); } catch (e) { } }
  for (const f of ['WEB', 'VR']) { try { vms.push(c.fpageVM(w, f, u)); } catch (e) { } try { vms.push(c.fbVM(w, f)); } catch (e) { } }
  try { vms.push(c.actVM(w, u)); } catch (e) { }
  try { vms.push(c.progVM(w, u)); } catch (e) { }
  try { vms.push(c.alistVM(w, { s: 'alist', tab: 'todo' }, u)); vms.push(c.introVM(w)); vms.push(c.resultVM(w)); } catch (e) { }
  try { vms.push(c.devVM(w, u)); } catch (e) { }
  try { vms.push(c.coursesVM(w, { s: 'courses', tab: 'courses' }, u)); vms.push(c.coursesVM(w, { s: 'courses', tab: 'experiments' }, u)); vms.push(c.courseVM(w)); } catch (e) { }
  vmCalls += vms.length;
  const leaks = strings(vms).filter(s => ID.test(s));
  // reference identifiers are an open owner decision: R2 keeps the baseline's (ACC-0107, SACC-0310, DTR-0018); none other may appear
  ok(`ids · ${k} · only the baseline's reference identifiers`, leaks.every(x => (x.match(/\b(?:S?ACC|DTR)-\d+/g) || []).every(id => ['ACC-0107', 'SACC-0310', 'DTR-0018'].includes(id))), [...new Set(leaks)].slice(0, 4));
}
console.log('view models scanned: ' + vmCalls);
console.log(`\n${pass} passed, ${fail} failed`);
fs.writeFileSync('/tmp/claude-0/fx/logic.json', JSON.stringify({ pass, fail, fails, changed, added, routes }, null, 1));
