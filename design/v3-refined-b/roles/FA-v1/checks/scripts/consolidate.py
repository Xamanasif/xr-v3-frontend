# Consolidate the role styling into ONE file (project/fa.css, prefix fa-) and point Main at it.
# Input: pre/Main.dc.html (fr- names), fa-published.css (published role extension), pre/fa-r1.css (R1 + final rules, fr- prefix)
# Output: project/Main.dc.html (classes renamed, one role stylesheet), project/fa.css (live rules only),
#         consolidation-report.json (rename map, pruned selectors), rename-map.json (for journeys and tools)
import os, re, json, sys, subprocess
FIN = os.path.dirname(os.path.abspath(__file__))
SP = os.path.dirname(FIN)
PROJ = os.path.join(FIN, 'project')
PRE = os.path.join(FIN, 'pre')
STAGE = os.path.join(FIN, 'stage')
os.makedirs(STAGE, exist_ok=True)

main = open(os.path.join(PRE, 'Main.dc.html'), encoding='utf-8').read()
fa_css = open(os.path.join(FIN, 'fa-published.css'), encoding='utf-8').read()
fr_css = open(os.path.join(PRE, 'fa-r1.css'), encoding='utf-8').read()

# ── 1 · rename fr- → fa- (explicit names where the plain rename would meet a live fa- class) ─────────────
OVERRIDE = {
  'fr-avail': 'fa-avail--panel', 'fr-avail-t': 'fa-avail-t',
  'fr-cellline': 'fa-cellline',
  'fr-deleted': 'fa-deletedbox',
  'fr-file': 'fa-file--import',
  'fr-form': 'fa-formcol',
  'fr-formfoot': 'fa-draftfoot', 'fr-formfoot-note': 'fa-draftfoot-note', 'fr-btn-primary': 'fa-draftfoot-primary',
  'fr-q': 'fa-sheetq', 'fr-q-h': 'fa-sheetq-h', 'fr-q-k': 'fa-sheetq-k', 'fr-q-m': 'fa-sheetq-m', 'fr-q-t': 'fa-sheetq-t',
  'fr-qact': 'fa-qact--order', 'fr-qlist': 'fa-qlist--spaced', 'fr-seg': 'fa-seg--bar',
  'fr-step': 'fa-nstep', 'fr-step-n': 'fa-nstep-n', 'fr-step-body': 'fa-nstep-body', 'fr-step-hint': 'fa-nstep-hint', 'fr-steps': 'fa-nsteps',
  'fr-stepper': 'fa-steps--fit',
}
CONTAINERS = {'frprog': 'faprog', 'frready': 'faready', 'frcourse': 'facourse', 'frcid': 'facid', 'frxp': 'faxp', 'frauthor': 'faauthor', 'frform': 'faform'}
TOK = re.compile(r'(?<![\w-])fr-[a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-z0-9]+)?(?:-)?')
found = set(TOK.findall(main)) | set(TOK.findall(fr_css))
rename = {}
for t in sorted(found):
    if t.endswith('-'):                       # string prefix used in concatenation, e.g. 'fr-prio--' + n
        base = t.rstrip('-'); rename[t] = 'fa-' + t[3:]
        continue
    rename[t] = OVERRIDE.get(t, 'fa-' + t[3:])
def apply(s):
    s = TOK.sub(lambda m: rename.get(m.group(0), m.group(0)), s)
    for a, b in CONTAINERS.items():
        s = re.sub(r'(?<![\w-])' + a + r'(?![\w-])', b, s)
    return s
main2 = apply(main)
fr2 = apply(fr_css)

# ── 2 · which classes are live: class attributes in Main, plus class strings built in its logic ─────────────
ID_ONLY = {'fa-exp', 'fa-errs', 'fa-h1', 'fa-main', 'fa-root', 'fa-tabh', 'fa-acct'}
CLASSLIKE = re.compile(r'^(?:(?:fa|fr|rk|rb|xr)-[a-z0-9-]*|is-[a-z0-9-]+)$')
def live_set(src, tag):
    # class attributes in the templates, plus every class-like word in the logic's string literals (real JS parser:
    # tools/jsstrings.mjs). A literal that is the left operand of `+` and ends in '-' is a class PREFIX completed at
    # runtime (e.g. 'fa-prio--' + n).
    toks = set()
    for m in re.finditer(r'class="([^"]*)"', src):
        v = re.sub(r'\{\{[^}]*\}\}', ' ', m.group(1))
        toks |= set(v.split())
    tmp = os.path.join(STAGE, 'strings-' + tag + '.dc.html'); open(tmp, 'w', encoding='utf-8').write(src)
    strs = json.loads(subprocess.run(['node', os.path.join(SP, 'tools', 'jsstrings.mjs'), tmp], capture_output=True, text=True, check=True).stdout)
    pref = set()
    for x in strs:
        words = x['s'].split()
        for w in words:
            if CLASSLIKE.match(w): toks.add(w)
        if x['lhs'] and words and not x['s'].endswith(' ') and CLASSLIKE.match(words[-1]) and words[-1].endswith('-'):
            pref.add(words[-1])
    return toks, pref
LIVE_OLD, LIVE_NEW = live_set(main, 'old'), live_set(main2, 'new')
EXTRA_LIVE = set(json.load(open(os.path.join(FIN, 'extra-live.json')))) if os.path.exists(os.path.join(FIN, 'extra-live.json')) else set()
def is_live(c, live):
    toks, pref = live
    if c in ID_ONLY: return False
    if c in toks or c in EXTRA_LIVE: return True
    return any(c.startswith(p) for p in pref)

# ── 3 · parse both stylesheets into rules (one nesting level: @container / @media) and keep live selectors ────
def parse(css):
    css = re.sub(r'/\*.*?\*/', lambda m: '' if '══' not in m.group(0) and '──' not in m.group(0) else m.group(0), css, flags=re.S)
    out = []; i = 0; n = len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0: break
        head = css[i:j].strip()
        comment = ''
        cm = re.findall(r'/\*.*?\*/', head, flags=re.S)
        if cm: comment = cm[-1]; head = re.sub(r'/\*.*?\*/', '', head, flags=re.S).strip()
        if head.startswith('@'):
            depth = 1; k = j + 1
            while depth and k < n:
                if css[k] == '{': depth += 1
                elif css[k] == '}': depth -= 1
                k += 1
            inner = css[j + 1:k - 1]
            out.append({'at': head, 'rules': parse(inner), 'comment': comment}); i = k
        else:
            k = css.find('}', j)
            out.append({'sel': head, 'body': css[j + 1:k].strip(), 'comment': comment}); i = k + 1
    return out
CLS = re.compile(r'\.((?:fa|rk|rb|xr)-[a-zA-Z0-9-]+|is-[a-z0-9-]+)')
pruned = []
def keep_rules(rules, toks):
    res = []
    for r in rules:
        if 'at' in r:
            sub = keep_rules(r['rules'], toks)
            if sub: res.append({'at': r['at'], 'rules': sub, 'comment': r['comment']})
            continue
        sels = [s.strip() for s in r['sel'].split(',')]
        ok = []
        for s in sels:
            classes = [c for c in CLS.findall(s) if c.startswith('fa-')]
            if all(is_live(c, toks) for c in classes): ok.append(s)
            else: pruned.append(s)
        if ok: res.append({'sel': ','.join(ok), 'body': r['body'], 'comment': r['comment']})
    return res
def emit(rules, ind=''):
    out = []
    for r in rules:
        if r.get('comment'): out.append('\n' + ind + r['comment'])
        if 'at' in r:
            out.append(ind + r['at'] + '{'); out.append(emit(r['rules'], ind + '  ')); out.append(ind + '}')
        else:
            out.append(ind + r['sel'] + '{' + r['body'] + '}')
    return '\n'.join(out)
fa_rules = keep_rules(parse(fa_css), LIVE_OLD)
n_pruned_published = len(pruned)
fr_rules = keep_rules(parse(fr2), LIVE_NEW)

# ── collision guards: a renamed class must not meet a class that is already live, or a kept published rule ───────
part1 = set()
def collect(rules, acc):
    for r in rules:
        if 'at' in r: collect(r['rules'], acc)
        else: acc.update(c for c in CLS.findall(r['sel']) if c.startswith('fa-'))
collect(fa_rules, part1)
old_live = {c for c in LIVE_OLD[0] if c.startswith('fa-')} | part1
MERGE = {'fa-cellline'}   # deliberate merge: fr-cellline was a copy of the published fa-cellline (display:block)
coll = []
for k, v in rename.items():
    if k.endswith('-'):
        coll += [(k, v, c) for c in old_live if c.startswith(v)]
    elif v in old_live and v not in MERGE:
        coll.append((k, v, v))
ids_old = set(re.findall(r'id="([^"{}]+)"', main))
coll += [('id ' + i, rename[i], rename[i]) for i in ids_old if i in rename and rename[i] in ids_old]
if coll:
    print('COLLISIONS', sorted(coll)[:40]); sys.exit(1)
HEADER = '''/* XR Learning Platform · Design V3 · Refined B · Faculty role stylesheet (fa- prefix) — FINAL complete-role design
   Foundation XR-V3-RB-1.0. Loaded after core.css → rb.css → rb-kit.css; additive only: it never redefines an xr-, rb- or rk-
   class or a global token outside an fa- context. Every value is an existing token from core.css (.xr) / rb.css (.rb) or a
   literal already used in rb-kit.css. No new colours, fonts, radius families or shadows.
   Part 1 carries the role components kept from the published Faculty build; part 2 the components of the refined design
   (R1 patterns applied across the role). Every component is listed in COMPONENT-EXTENSIONS.md. */
'''
css_out = HEADER + '\n/* ════════ Part 1 · role components kept from the published build ════════ */\n' + emit(fa_rules) + '\n\n/* ════════ Part 2 · refined design components ════════ */\n' + emit(fr_rules) + '\n'
css_out = re.sub(r'\n{3,}', '\n\n', css_out)

# ── 4 · write: one role stylesheet, Main linked to it only ───────────────────────────────────────────────────
main2 = main2.replace('<link rel="stylesheet" href="./fa.css">\n<link rel="stylesheet" href="./fa-r1.css">\n', '<link rel="stylesheet" href="./fa.css">\n')
if 'fa-r1.css' in main2: sys.exit('fa-r1.css still referenced')
open(os.path.join(PROJ, 'Main.dc.html'), 'w', encoding='utf-8').write(main2)
open(os.path.join(PROJ, 'fa.css'), 'w', encoding='utf-8').write(css_out)
if os.path.exists(os.path.join(PROJ, 'fa-r1.css')): os.remove(os.path.join(PROJ, 'fa-r1.css'))
json.dump(rename, open(os.path.join(FIN, 'rename-map.json'), 'w'), indent=1, sort_keys=True)
json.dump({'renamed': len(rename), 'containers': CONTAINERS, 'pruned_published': pruned[:n_pruned_published], 'pruned_refined': pruned[n_pruned_published:]}, open(os.path.join(FIN, 'consolidation-report.json'), 'w'), indent=1)
left = set(TOK.findall(main2)) | set(TOK.findall(css_out))
print('renamed', len(rename), 'fr- names; pruned', len(pruned), 'selectors; fa.css', len(css_out), 'bytes; leftover fr- tokens:', sorted(left)[:20])
