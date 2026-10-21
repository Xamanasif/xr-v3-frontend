# Write project/v3-student-final.css — the ONE Student role stylesheet of the final design:
#   Part A · the rules of the baseline role sheet (v3-student.css, locked) that the final templates can still match, verbatim;
#   Part B · the Student components (sv-), from final-src/sv.css.
# A rule (or one selector of a list) is dropped only when it needs a class the final source never produces, so nothing that
# can match is lost. Run after fx_build.py (it reads the built StudentFinal.dc.html).
import pathlib, re, json, hashlib
P = pathlib.Path('/home/claude/work/project'); S = pathlib.Path('/home/claude/work/final-src')
html = (P / 'StudentFinal.dc.html').read_text()
# ── classes the final source can produce ────────────────────────────────────────────────────────────────
used, prefixes = set(), set()
for m in re.finditer(r'class="([^"]*)"', html):
    used.update(re.sub(r'\{\{.*?\}\}', ' ', m.group(1)).split())
script = html[html.index('<script type="text/x-dc"'):]
for q in ("'", '"', '`'):
    for m in re.finditer(q + r'((?:[^' + q + r'\\\n]|\\.)*)' + q, script):
        s = m.group(1)
        for t in re.split(r'[\s${}()+]+', s):
            if re.fullmatch(r'[A-Za-z_][\w-]*', t): used.add(t)
            if re.fullmatch(r'[A-Za-z_][\w-]*-', t): prefixes.add(t)
# id / focus-target prefixes, not class prefixes (st-q-3, st-ans-2, st-fb-web, st-fc-vr, st-res-st-r1)
prefixes -= {'st-q-', 'st-ans-', 'st-fb-', 'st-fc-', 'st-res-st-'}
# classes produced only by two verbatim hubVM fields (cells, note) that no final template reads: the retired 72 px format
# cells and the old hub note band. Verified here, then treated as unused.
RETIRED = {'rk-fcell', 'rk-fcell--on', 'rk-fcell--pub', 'rk-fcell--none', 'st-fcell--held', 'st-fcell--ended',
           'st-band-note', 'st-band-note--paused', 'st-band-note--wait'}
tpl = ''.join(m.group(1) + ' ' for m in re.finditer(r'class="([^"]*)"', html))
assert not any(t in tpl.split() for t in RETIRED), 'a retired class is in a template'
assert not re.search(r'HB\.(cells|note)\b', html), 'a template reads HB.cells / HB.note'
ci = html.index('  cellOf(a) {'); cj = html.index('\n  }', ci)               # the cellOf method
ni = html.index('    V.note = paused ?'); nj = html.index('\n', html.index('\n', ni) + 1)   # hubVM's two-line note
for t in RETIRED:
    for m in re.finditer(r"(?<![\w-])" + re.escape(t) + r"(?![\w-])", html):
        assert ci <= m.start() <= cj or ni <= m.start() <= nj, ('retired class used elsewhere', t, html[m.start() - 60:m.start() + 20])
used -= RETIRED
def avail(c): return c in used or any(c.startswith(p) for p in prefixes)
def required(sel):
    s = sel
    while True:   # drop functional pseudo-classes whose classes are optional (:not, :is, :where, :has)
        n = re.sub(r':(?:not|is|where|has)\((?:[^()]|\([^()]*\))*\)', '', s)
        if n == s: break
        s = n
    return re.findall(r'\.([A-Za-z_][\w-]*)', s)
def split_top(sel):
    out, depth, cur = [], 0, ''
    for ch in sel:
        if ch == '(': depth += 1
        if ch == ')': depth -= 1
        if ch == ',' and depth == 0: out.append(cur); cur = ''
        else: cur += ch
    out.append(cur); return out
stats = {'rules kept': 0, 'rules dropped': 0, 'selectors dropped': 0, 'dropped': []}
def process(text):
    """returns pruned text of a block's content"""
    out, i, n, pending = [], 0, len(text), []
    while i < n:
        if text.startswith('/*', i):
            j = text.index('*/', i) + 2; pending.append(text[i:j]); i = j; continue
        if text[i].isspace():
            j = i
            while j < n and text[j].isspace(): j += 1
            pending.append(text[i:j]); i = j; continue
        j = text.index('{', i); head = text[i:j]
        if head.strip().startswith('@'):
            depth, k = 1, j + 1
            while depth:
                depth += {'{': 1, '}': -1}.get(text[k], 0); k += 1
            inner = process(text[j + 1:k - 1])
            if inner.strip() and re.search(r'\{', inner):
                out.extend(pending); out.append(head + '{' + inner + '}')
            pending = []; i = k; continue
        k = text.index('}', j); body = text[j + 1:k]
        sels = split_top(head)
        keep = [s for s in sels if all(avail(c) for c in required(s))]
        drop = [s.strip() for s in sels if s not in keep]
        stats['selectors dropped'] += len(drop)
        if keep:
            stats['rules kept'] += 1
            out.extend(pending)
            out.append(head + '{' + body + '}' if not drop else ','.join(keep) + '{' + body + '}')
        else:
            stats['rules dropped'] += 1; stats['dropped'].append(head.strip()[:80])
            # keep a section-header comment only if a later rule of the section survives (handled below)
            out.extend(p for p in pending if p.isspace() or p.startswith('/* ──') or p.startswith('/* ══'))
        pending = []; i = k + 1
    out.extend(p for p in pending if p.isspace())
    return ''.join(out)
base = (P / 'v3-student.css').read_text()
assert hashlib.sha256(base.encode()).hexdigest().startswith('53ffc66464bb'), 'v3-student.css changed!'
body = base[base.index('*/') + 2:]            # drop its file header; Part A gets its own
a = process(body)
# remove section headers left with no rules after them
lines = a.split('\n'); res = []
for idx, ln in enumerate(lines):
    if ln.startswith('/* ──') or ln.startswith('/* ══'):
        nxt = next((l for l in lines[idx + 1:] if l.strip()), '')
        if nxt.startswith('/* ──') or nxt.startswith('/* ══') or not nxt: continue
    res.append(ln)
a = re.sub(r'\n{3,}', '\n\n', '\n'.join(res)).strip('\n')
sv = (S / 'sv.css').read_text()
svbody = sv[sv.index('*/') + 2:].strip('\n')
head = '''/* XR Learning Platform · Design V3 · Refined Direction B · Student · the ONE role stylesheet of the final design
   Foundation XR-V3-RB-1.0: load after core.css, rb.css and rb-kit.css, which stay byte-identical. This file replaces
   v3-student.css and every checkpoint stylesheet for the Student role; nothing else is needed.
   Part A · shell, review controls, focused-task shell and the borrowed XS surfaces (xsb-): the rules of the baseline
            v3-student.css that the final screens still use, verbatim. Rules for retired components are not carried.
   Part B · Student components (sv-), one format language and the type roles in COMPONENT-EXTENSIONS.md.
   No custom properties are defined here; no base (xr-, rb-, rk-) class is restyled outside a Student context; every
   literal colour is already a value of core.css, rb.css or rb-kit.css. */
'''
out = head + '\n/* ═══ Part A · carried from v3-student.css (baseline role sheet), verbatim ═══════════════════════════════════ */\n' + a + \
      '\n\n/* ═══ Part B · Student components (sv-) ═════════════════════════════════════════════════════════════════════ */\n' + svbody + '\n'
(P / 'v3-student-final.css').write_text(out)
json.dump({k: v for k, v in stats.items()}, open('/tmp/claude-0/fx/consolidate.json', 'w'), indent=1)
print('v3-student-final.css', len(out.encode()), 'bytes', hashlib.sha256(out.encode()).hexdigest()[:12], '| Part A rules kept', stats['rules kept'], 'dropped', stats['rules dropped'], 'selectors dropped', stats['selectors dropped'])
