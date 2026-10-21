# Source checks for the FINAL Student design (review only): one role stylesheet, classes defined, stylesheet rules,
# colours, region-only changes against Main, and every lock (foundation, original delivery, checkpoints 1/2, R2).
import re, json, hashlib, pathlib, sys, difflib
sys.path.insert(0, '/home/claude/scripts')
from r2_regions import T, L, VM_FILES, span
P = pathlib.Path('/home/claude/work/project'); S = pathlib.Path('/home/claude/work/final-src'); W = pathlib.Path('/home/claude/work')
sha = lambda p: hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
html = (P / 'StudentFinal.dc.html').read_text()
fin = (P / 'v3-student-final.css').read_text()
base = ''.join((P / f).read_text() for f in ['core.css', 'rb.css', 'rb-kit.css'])
old = (P / 'v3-student.css').read_text()
out = {}
# 0 the final root loads the foundation and ONE role stylesheet
links = re.findall(r'<link rel="stylesheet" href="\./([^"]+)">', html[:html.index('</head>')])
out['stylesheets the final root loads'] = links
out['loads exactly foundation + v3-student-final.css'] = links == ['core.css', 'rb.css', 'rb-kit.css', 'v3-student-final.css']
# 1 every class the final preview uses is defined in the four stylesheets it loads
allcss = base + fin
defined = set(re.findall(r'\.([A-Za-z_][\w-]*)', allcss))
used = set()
for m in re.finditer(r'class="([^"]*)"', html):
    used.update(c for c in re.sub(r'\{\{.*?\}\}', ' ', m.group(1)).split())
for m in re.finditer(r"(?:[cC]ls|class)\w*\s*[:=]\s*'([^']*)'|\[\s*'((?:xr|rk|rb|sv|xsb|st)-[^']*)'\s*,", html):
    for c in (m.group(1) or m.group(2) or '').split():
        if re.match(r'^(rk|rb|xr|st|xsb|sv)-[\w-]+$', c): used.add(c)
for m in re.finditer(r"\+ \(\w+ \? '( (?:rk|rb|xr|st|xsb|sv)-[\w-]+)'", html): used.add(m.group(1).strip())
for m in re.finditer(r"'( (?:is|sv|st)-[\w-]+)'", html): used.add(m.group(1).strip())
RETIRED = {'rk-fcell', 'rk-fcell--on', 'rk-fcell--pub', 'rk-fcell--none', 'st-fcell--held', 'st-fcell--ended', 'st-band-note', 'st-band-note--paused', 'st-band-note--wait'}
missing = sorted(c for c in used if c not in defined and c not in RETIRED and not c.endswith('-'))
out['classes used'] = len(used)
out['classes used but not defined'] = missing
out['class-name prefixes joined with a tone in code (e.g. sv-refuse-ico-- + off)'] = sorted(c for c in used if c.endswith('-'))
out['retired classes still produced by two verbatim hubVM fields that no template renders (cells, note)'] = sorted(c for c in used if c in RETIRED)
# 2 the final stylesheet: Part A verbatim from v3-student.css, Part B sv- only
iA, iB = fin.index('/* ═══ Part A'), fin.index('/* ═══ Part B')
partA, partB = fin[iA:iB], fin[iB:]
def rules(text):
    body = re.sub(r'/\*.*?\*/', '', text, flags=re.S); res = []
    def walk(s, ctx):
        i = 0
        while i < len(s):
            j = s.find('{', i)
            if j < 0: break
            head = s[i:j].strip()
            if head.startswith('@'):
                depth, k = 1, j + 1
                while depth: depth += {'{': 1, '}': -1}.get(s[k], 0); k += 1
                walk(s[j + 1:k - 1], ctx + (re.sub(r'\s+', ' ', head),)); i = k
            else:
                k = s.find('}', j); res.append((ctx, [x.strip() for x in head.split(',')], s[j + 1:k].strip())); i = k + 1
    walk(body, ()); return res
oldr = rules(old)
idx = {}
for ctx, sels, b in oldr: idx.setdefault((ctx, b), []).append(set(sels))
notverb = [(c, s) for c, s, b in rules(partA) if not any(set(s) <= o for o in idx.get((c, b), []))]
out['Part A rules'] = len(rules(partA))
out['Part A rules not verbatim from v3-student.css (pruned selector lists allowed)'] = notverb
rb = rules(partB)
sels = [s for c, ss, b in rb for s in ss]
out['Part B rules'] = len(rb)
out['Part B selectors without sv-'] = [s for s in sels if 'sv-' not in s]
out['Part B base classes restyled outside sv- context'] = [s for s in sels if re.match(r'^\.(xr|rb|rk|st|xsb)-[\w-]+$', s)]
bodyB = re.sub(r'/\*.*?\*/', '', partB, flags=re.S)
out['custom properties defined (whole file)'] = re.findall(r'(?<![\w-])--[\w-]+\s*:', re.sub(r'/\*.*?\*/', '', fin, flags=re.S))
out['!important in Part B'] = bodyB.count('!important')
out['!important in Part A (carried review-controls toggle only)'] = re.findall(r'[^{}]*\{[^}]*!important[^}]*\}', re.sub(r'/\*.*?\*/', '', partA, flags=re.S))[:3]
out['at-rules'] = sorted(set(c for cc, s, b in rules(fin) for c in cc))
out['descendant span selectors that could catch the runtime interpolation spans (Part B; a sibling span + span rule is safe)'] = [s for s in sels if re.search(r'\sspan\b(?![-\w])', s) and not re.search(r'>\s*span\b', s) and not re.search(r'span\s*\+\s*span', s)]
cols = sorted(set(x.upper() for x in re.findall(r'#[0-9A-Fa-f]{3,8}\b', bodyB)))
basecols = set(x.upper() for x in re.findall(r'#[0-9A-Fa-f]{3,8}\b', base + old))
out['Part B literal colours not in the base files'] = [c for c in cols if c not in basecols]
out['Part B rgb()/hsl() literals'] = re.findall(r'\b(?:rgb|rgba|hsl|hsla)\(', bodyB)
out['gradients (whole file)'] = re.findall(r'gradient\(', re.sub(r'/\*.*?\*/', '', fin, flags=re.S))
out['animations (whole file; selectors)'] = [m.group(1).strip()[:60] for m in re.finditer(r'([^{}]*)\{[^}]*animation\s*:[^}]*\}', re.sub(r'/\*.*?\*/', '', fin, flags=re.S))]
out['keyframes defined here'] = re.findall(r'@keyframes', fin)
out['transitions (Part B)'] = re.findall(r'transition:[^;}]*', bodyB)
out['font families named (Part B)'] = re.findall(r'font-family\s*:[^;}]*|serif', bodyB)
out['font sizes below 13px (Part B)'] = sorted(set(x for x in re.findall(r'(?<![\d.])(\d+(?:\.\d+)?)px/', bodyB) if float(x) < 13))
out['font sizes below 13px (Part A, carried)'] = sorted(set(x for x in re.findall(r'(?<![\d.])(\d+(?:\.\d+)?)px/', re.sub(r'/\*.*?\*/', '', partA, flags=re.S)) if float(x) < 13))
svdef = sorted(set(re.findall(r'\.(sv-[\w-]+)', partB)))
out['sv classes defined'] = len(svdef)
out['sv classes defined but never in the final source'] = [c for c in svdef if not re.search(r'(?<![\w-])' + re.escape(c) + r'(?![\w-])', html) and not any(re.search(r"'" + re.escape(c[:k]) + r"'", html) for k in range(len(c) - 1, 4, -1) if c[k - 1] == '-')]
# 3 StudentFinal = Main with the final regions replaced, plus the declared edits — nothing else
main = (P / 'Main.dc.html').read_text()
cutsM, cutsR = [], []
for name, a, b in T:
    i, j = span(main, a, b); cutsM.append((i, j, name)); cutsR.append((S / (name + '.html')).read_text())
i, j = span(main, *L[0][1:]); cutsM.append((i, j, 'msg.js')); cutsR.append((S / 'msg.js').read_text())
i, j = span(main, *L[1][1:]); cutsM.append((i, j, 'vm')); cutsR.append(''.join((S / f).read_text() for f in VM_FILES))
order = sorted(range(len(cutsM)), key=lambda k: cutsM[k][0])
a_parts, pos = [], 0
for k in order:
    i, j, name = cutsM[k]; a_parts.append(main[pos:i]); a_parts.append('«' + name + '»'); pos = j
a_parts.append(main[pos:]); a = ''.join(a_parts)
b = html
for k in order:
    new = cutsR[k]; name = cutsM[k][2]
    assert b.count(new) >= 1, name
    b = b.replace(new, '«' + name + '»', 1)
d = [l for l in difflib.unified_diff(a.splitlines(), b.splitlines(), lineterm='', n=0) if l.startswith(('+', '-')) and not l.startswith(('+++', '---'))]
out['StudentFinal vs Main outside the replaced regions (expected: title, stylesheet link, render edits)'] = d
# 4 locks: foundation, original delivery, checkpoints 1 and 2, R2 — all byte-identical
lock = json.loads((W / 'delivery' / 'FOUNDATION-LOCK.json').read_text())
lr2 = json.loads((W / 'delivery-r2' / 'FOUNDATION-LOCK.json').read_text())
out['foundation (core, rb, rb-kit) byte-identical'] = all(sha(P / k.split('/', 1)[1]) == v['originalSha256'] for k, v in lock['baseFiles'].items())
out['original delivery unchanged (Main, v3-student.css, 112 boards)'] = sha(P / 'Main.dc.html') == lock['localAdditions']['rolePreviewRoot']['project/Main.dc.html'] and sha(P / 'v3-student.css') == lock['localAdditions']['stylesheet']['project/v3-student.css'] and all(sha(P / k.split('/', 1)[1]) == v for k, v in lock['localAdditions']['inspectionBoards'].items())
c1, c2 = lr2['earlierCheckpointsUnchanged']['checkpoint1'], lr2['earlierCheckpointsUnchanged']['checkpoint2']
flat = lambda d: {k: v for k, v in d.items() if k != 'boards'} | d['boards']
out['checkpoint 1 unchanged'] = all(sha(P / k.split('/', 1)[1]) == v for k, v in flat(c1).items())
out['checkpoint 2 unchanged'] = all(sha(P / k.split('/', 1)[1]) == v for k, v in flat(c2).items())
r2a = lr2['r2Additions']
out['R2 unchanged (StudentR2, v3-student-r2.css, 108 boards)'] = all(sha(P / k.split('/', 1)[1]) == v for k, v in (r2a['previewRoot'] | r2a['stylesheet'] | r2a['boards']).items())
print(json.dumps(out, indent=1, ensure_ascii=False))
