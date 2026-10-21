# Pixel comparison of two render sets (same spec names): python3 pixcmp.py <dirA> <dirB> [out.json]
# Also, when dirA/results.json carries DOM class lists (spec 'extra'), checks that every class seen in a render that had
# a rule before consolidation still has a rule in the consolidated fa.css.
import json, os, re, sys
from PIL import Image, ImageChops
A, B = sys.argv[1], sys.argv[2]
OUT = sys.argv[3] if len(sys.argv) > 3 else None
FIN = os.path.dirname(os.path.abspath(__file__))
ra = {r['name']: r for r in json.load(open(os.path.join(A, 'results.json')))}
rb = {r['name']: r for r in json.load(open(os.path.join(B, 'results.json')))}
rep = {'identical': [], 'different': [], 'missing': [], 'size': []}
for n in sorted(ra):
    pa, pb = os.path.join(A, n + '.png'), os.path.join(B, n + '.png')
    if n not in rb or not os.path.exists(pb): rep['missing'].append(n); continue
    ia, ib = Image.open(pa).convert('RGB'), Image.open(pb).convert('RGB')
    if ia.size != ib.size:
        rep['size'].append({'name': n, 'a': ia.size, 'b': ib.size}); continue
    d = ImageChops.difference(ia, ib)
    bbox = d.getbbox()
    if not bbox: rep['identical'].append(n); continue
    px = sum(1 for p in d.crop(bbox).getdata() if p != (0, 0, 0))
    rep['different'].append({'name': n, 'bbox': bbox, 'pixels': px})
print('identical', len(rep['identical']), '· different', len(rep['different']), '· size changed', len(rep['size']), '· missing', len(rep['missing']))
for x in rep['different'][:40]: print('  DIFF', x)
for x in rep['size'][:40]: print('  SIZE', x)
for x in rep['missing'][:40]: print('  MISSING', x)

# class cross-check
if any(isinstance(r.get('extra'), list) for r in ra.values()):
    rename = json.load(open(os.path.join(FIN, 'rename-map.json')))
    TOK = re.compile(r'(?<![\w-])fr-[a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-z0-9]+)?(?:-)?')
    def sel_classes(css):
        css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
        out = set()
        for m in re.finditer(r'([^{}]+)\{', css):
            out |= set(re.findall(r'\.((?:fa|fr)-[a-zA-Z0-9-]+)', m.group(1)))
        return out
    pre = sel_classes(open(os.path.join(FIN, 'fa-published.css')).read()) | sel_classes(open(os.path.join(FIN, 'pre', 'fa-r1.css')).read())
    post = sel_classes(open(os.path.join(FIN, 'project', 'fa.css')).read())
    seen = set()
    for r in ra.values():
        if isinstance(r.get('extra'), list): seen |= set(r['extra'])
    lost = []
    for c in sorted(seen):
        if not (c.startswith('fa-') or c.startswith('fr-')): continue
        if c not in pre: continue
        c2 = TOK.sub(lambda m: rename.get(m.group(0), m.group(0)), c) if c.startswith('fr-') else c
        if c2 not in post: lost.append((c, c2))
    print('DOM classes seen', len(seen), '· with a rule before', len([c for c in seen if c in pre]), '· rule lost after consolidation', len(lost), lost[:30])
    rep['dom'] = {'seen': len(seen), 'lost': lost}
    # kept-but-never-rendered classes (informational: states reachable only through interaction keep their rules)
    seen2 = {TOK.sub(lambda m: rename.get(m.group(0), m.group(0)), c) for c in seen}
    rep['kept_not_rendered'] = sorted(c for c in post if c not in seen2)
    print('classes kept in fa.css but not in any render:', len(rep['kept_not_rendered']))
if OUT: json.dump(rep, open(OUT, 'w'), indent=1)
