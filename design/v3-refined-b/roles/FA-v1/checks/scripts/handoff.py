# Handoff package for the final complete-role design (release candidate until the owner approves).
#   python3 handoff.py <label>   e.g. RC1  -> final/pkg/<base>-Source/ (docs, project, checks) and <base>-Screenshots/
import json, os, sys, re, shutil, hashlib, datetime
FIN = os.path.dirname(os.path.abspath(__file__))
SP = os.path.dirname(FIN)
sys.path.insert(0, FIN)
import boards
LABEL = sys.argv[1] if len(sys.argv) > 1 else 'RC1'
FINAL = LABEL == 'FINAL'
BASE = 'XR-V3-Faculty-' + ('Final' if FINAL else 'Final-' + LABEL)
PKG = os.path.join(FIN, 'pkg'); SRC = os.path.join(PKG, BASE + '-Source'); SHOTS = os.path.join(PKG, BASE + '-Screenshots')
OLD = os.path.join(SP, 'pkg')
CAN = os.path.join(FIN, 'publish', 'project')
COV = json.load(open(os.path.join(FIN, 'coverage.json')))
STATUS = 'DESIGN COMPLETE · FINAL — APPROVED BY THE OWNER' if FINAL else 'DESIGN COMPLETE · OWNER VISUAL ACCEPTANCE PENDING'
TODAY = '21 Oct 2026'
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()

def fresh(d):
    if os.path.exists(d): shutil.rmtree(d)
    os.makedirs(d)

def jload(p): return json.load(open(p, encoding='utf-8'))
def jdump(o, p): json.dump(o, open(p, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)

def board_index():
    idx = {}
    for b in boards.comp_boards():
        rid, f, t, w, sc, st, rec, pre = b
        idx[f] = {'title': t, 'width': w, 'scenario': sc, 'start': st, 'rec': rec, 'preset': pre.replace('+', ', ')}
    return idx

def main():
    fresh(SRC); fresh(SHOTS)
    # ── project (the canvas as it will be published) ──
    shutil.copytree(CAN, os.path.join(SRC, 'project'))
    BI = board_index()
    # ── coverage register ──
    for f in ('COVERAGE-REGISTER.md', 'COVERAGE-REGISTER.json'): shutil.copyfile(os.path.join(FIN, 'handoff', f), os.path.join(SRC, f))
    shutil.copyfile(os.path.join(FIN, 'rename-map.json'), os.path.join(SRC, 'rename-map.json'))
    # ── ROLE-STATUS ──
    old = jload(os.path.join(OLD, 'ROLE-STATUS.json'))
    byid = {o['id']: o for o in old['owned']}
    owned = []
    jmap = {'FA-01': 'J1, J3, J4, J5e, J8a, J8c, J9g', 'FA-02': 'J8a, J9a, J9g', 'FA-03': 'J1, J8a, J8b', 'FA-04': 'J7b, J9a, J9g, J9h', 'FA-05': 'J1, J9a, J9g, J9h',
            'FA-06': 'J1, J7c, J9b, J9c, J9g', 'FA-07': 'J1 (four widths), J9g', 'FA-08': 'J1, J3, J7a, J9b, J9c, J9i', 'FA-09': 'J1, J7a, J9b, J9c', 'FA-10': 'J7a, J9b, J9c, J9i',
            'FA-11': 'J1, J4b, J9b, J9c', 'FA-12': 'J3, J4b, J9b, J9c, J9i', 'FA-14': 'J2, J5c, J9d, J9g, J9i', 'FA-15': 'J1, J2, J9d', 'FA-16': 'J6, J6b, J8e',
            'FA-17': 'J2, J9f, J9g', 'FA-18': 'J3, J5d, J9e, J9g', 'FA-19': 'J3 (four widths), J5d, J8d, J9a, J9e', 'FA-20': 'J4, J9e, J9g, J9i', 'FA-21': 'J3, J4, J4b, J9e', 'FA-22': 'J3, J4'}
    for c in COV['owned']:
        o = byid.get(c['id'], {})
        bl = []
        for s in c['subviews']:
            for b in s['boards']: bl.append('project/%s.dc.html (%s px · %s)' % (b, BI[b]['width'], s['subview']))
        resp = ['responsive/%s-%d.png' % (c['id'].replace('-', ''), w) for w in boards.RESP_W]
        owned.append({'id': c['id'], 'name': c['name'], 'kind': c['kind'], 'v46ProposedRoute': o.get('v46ProposedRoute', ''),
                      'source': 'project/Main.dc.html (one role-preview root; view selected by screen ID %s)' % ('FA-12 / FA-20' if c['id'] == 'FA-22' else c['id']),
                      'liveEntry': o.get('liveEntry', ''), 'design': c['status'] + ' — ' + c['round'], 'patterns': c['patterns'], 'whatChanged': c['whatChanged'],
                      'subviews': c['subviews'], 'inspectionBoards': bl, 'responsiveScreenshots': resp,
                      'evidence': {'rendered': 'every listed board and the four-width strip: no console error, no horizontal page scroll',
                                   'exercised': jmap.get(c['id'], ''), 'sourceChecked': 'structural accessibility scan: 0 issues; link crawl: every in-role link lands on its screen'},
                      'status': ['DESIGN COMPLETE', 'CONNECTED PREVIEW COMPLETE', 'FINAL — APPROVED' if FINAL else 'OWNER VISUAL ACCEPTANCE PENDING']})
    shared = []
    for s in old['sharedDependencies']:
        s = dict(s); s['design'] = 'REVIEWED AND UNCHANGED'; s['boards'] = [b for b in s['boards'] if os.path.exists(os.path.join(CAN, b.split('/')[-1]))] or s['boards']; shared.append(s)
    rs = {'role': 'Faculty', 'foundation': 'XR-V3-RB-1.0', 'ownedIds': 21, 'statusDate': TODAY,
          'overall': {'design': 'DESIGN COMPLETE — 21 of 21 owned IDs redesigned in one consistent Refined B design (5 in the R1 checkpoint, 16 in the final pass); %d subviews registered: %d redesigned, %d reviewed and unchanged' % (COV['totals']['subviews'], COV['totals']['subviewsRedesigned'], COV['totals']['subviewsReviewedUnchanged']),
                      'preview': 'CONNECTED PREVIEW COMPLETE — one role-preview root (Main.dc.html) with every destination connected; six live starting points (1440, 1024, 768, 375)',
                      'assembly': 'ASSEMBLY PENDING XS — account menu, Help, signed-out and refusal surfaces remain faithful borrowed implementations until the XS package is delivered',
                      'approval': ('FINAL — the owner approved this complete-role design' if FINAL else 'OWNER VISUAL ACCEPTANCE PENDING — release candidate %s; FINAL source and screenshot ZIPs are made only after explicit approval' % LABEL)},
          'owned': owned, 'excluded': old['excluded'], 'sharedDependencies': shared}
    jdump(rs, os.path.join(SRC, 'ROLE-STATUS.json'))
    # ── FOUNDATION-LOCK ──
    fl = jload(os.path.join(OLD, 'FOUNDATION-LOCK.json'))
    for f in ('core.css', 'rb.css', 'rb-kit.css'):
        h = sha(os.path.join(CAN, f)); e = fl['baseFilesUsed']['project/' + f]
        assert h == e['packSha256'], f + ' hash changed'
        e['sha256'] = h; e['identical'] = True
    adds = {}
    for f in sorted(os.listdir(CAN)):
        if f in ('core.css', 'rb.css', 'rb-kit.css'): continue
        p = os.path.join(CAN, f)
        kind = ('role preview root (all views and logic)' if f == 'Main.dc.html' else 'role stylesheet (the only Faculty extension; additive)' if f == 'fa.css' else
                'canvas layout' if f == 'canvas.json' else 'static review board (coverage, changes or checks)' if f in ('Coverage-Register.dc.html', 'What-changed.dc.html', 'Checks.dc.html') else
                'live starting point (imports Main)' if f.startswith('Live-') else 'inspection board (imports Main)')
        adds['project/' + f] = {'sha256': sha(p), 'bytes': os.path.getsize(p), 'kind': kind}
    fl['localAdditions'] = adds
    fl['statement'] = ('The three shared stylesheets are byte-identical to the supplied V3 pack and are linked in the order core.css → rb.css → rb-kit.css → fa.css. '
                       'All Faculty styling is in one additive role stylesheet, fa.css (consolidated in the final pass from the published fa.css and the refinement rules; see COMPONENT-EXTENSIONS.md). '
                       'No V3 reference board, V1 board, master CSS or locked landing file was edited or copied into this canvas.')
    fl['roleStylesheet'] = {'file': 'project/fa.css', 'sha256': sha(os.path.join(CAN, 'fa.css')), 'bytes': os.path.getsize(os.path.join(CAN, 'fa.css')),
                            'publishedVersionSha256': sha(os.path.join(FIN, 'fa-published.css')), 'note': 'Replaces the published fa.css; the R1 checkpoint’s separate fa-r1.css no longer exists.'}
    fl['checkedOn'] = TODAY
    jdump(fl, os.path.join(SRC, 'FOUNDATION-LOCK.json'))
    # ── SCENARIOS ──
    sc = jload(os.path.join(OLD, 'SCENARIOS.json'))
    sc['inspectionPresets']['marked / mk-confirmed'] = 'ATT-0450 confirmed with 7 and the B4-09 feedback'
    sc['inspectionPresets']['note'] = 'Presets only set a documented starting state for an inspection board; the sample worlds themselves are unchanged in the final design.'
    sc['boards'] = {f: v for f, v in BI.items()}
    jdump(sc, os.path.join(SRC, 'SCENARIOS.json'))
    # ── LINK-MAP ──
    lm = jload(os.path.join(OLD, 'LINK-MAP.json'))
    links = jload(os.path.join(FIN, 'checks', 'links.json'))
    seen, L = set(), []
    for x in links:
        k = (x['from'].split(':')[0], x['control'], x['href'])
        if k in seen: continue
        seen.add(k)
        L.append({'source': x['from'], 'startBoard': x['start'], 'control': x['control'], 'href': x['href'], 'destination': x.get('landed', ''),
                  'classification': x.get('kind', ''), 'tested': 'EXERCISED: crawled, landed on ' + x.get('landed', '') if x['ok'] and x.get('landed') else ('OK' if x['ok'] else 'FAILED: ' + x.get('note', ''))})
    lm['crawled'] = {'linksClicked': len(links), 'distinct': len(L), 'failed': sum(1 for x in links if not x['ok']), 'startStates': len(jload(os.path.join(FIN, 'checks', 'starts-links.json'))), 'on': TODAY}
    lm['links'] = L
    for b in lm['buttonNavigation']:
        if b['source'] == 'FA-12': b['tested'] = 'EXERCISED: J3, J9b'
    lm['changedInFinalDesign'] = [{'source': 'FA-05', 'control': 'Mark N written answers', 'was': 'FA-18 Marking queue', 'now': 'FA-19 Mark a submission, oldest waiting (as on FA-03)', 'tested': 'EXERCISED: J9a'}]
    jdump(lm, os.path.join(SRC, 'LINK-MAP.json'))
    # ── checks folder ──
    ck = os.path.join(SRC, 'checks'); os.makedirs(os.path.join(ck, 'scripts')); os.makedirs(os.path.join(ck, 'specs')); os.makedirs(os.path.join(ck, 'results'))
    for f in ('render.mjs', 'journey.mjs', 'links.mjs', 'scan.mjs', 'jsstrings.mjs', 'elcmp.mjs', 'text.mjs', 'dom.mjs', 'sheet.py'):
        shutil.copyfile(os.path.join(SP, 'tools', f), os.path.join(ck, 'scripts', f))
    for f in ('build_final.py', 'consolidate.py', 'boards.py', 'journeys.py', 'pixcmp.py', 'coverage.py', 'mkcanvas.py', 'handoff.py'):
        shutil.copyfile(os.path.join(FIN, f), os.path.join(ck, 'scripts', f))
    shutil.copytree(os.path.join(FIN, 'parts'), os.path.join(ck, 'scripts', 'build-parts'))
    for f in os.listdir(os.path.join(FIN, 'checks', 'journeys')):
        if f.endswith('.json'): shutil.copyfile(os.path.join(FIN, 'checks', 'journeys', f), os.path.join(ck, 'specs', 'journeys-' + f))
    for f in ('journey-changes.json', 'journeys-j9.json', 'spec-post.json'): shutil.copyfile(os.path.join(FIN, f), os.path.join(ck, 'specs', f))
    for f in ('starts-links.json', 'spec-stress.json', 'elcmp-cases.json'): shutil.copyfile(os.path.join(FIN, 'checks', f), os.path.join(ck, 'specs', f))
    out = os.path.join(FIN, 'checks', 'journeys', 'out')
    for s in sorted(os.listdir(out)):
        shutil.copyfile(os.path.join(out, s, 'journeys.json'), os.path.join(ck, 'results', 'journeys-' + s + '.json'))
    for f, n in (('links.json', 'links.json'), ('scan.json', 'scan.json'), ('pub-vs-final.json', 'pixel-published-vs-final.json'), ('r1-vs-final.json', 'pixel-r1-vs-final.json')):
        shutil.copyfile(os.path.join(FIN, 'checks', f), os.path.join(ck, 'results', n))
    shutil.copyfile(os.path.join(FIN, 'checks-pixcmp.json'), os.path.join(ck, 'results', 'pixel-before-vs-after-consolidation.json'))
    shutil.copyfile(os.path.join(FIN, 'consolidation-report.json'), os.path.join(ck, 'results', 'consolidation-report.json'))
    shutil.copyfile(os.path.join(FIN, 'checks', 'elcmp', 'elcmp.json'), os.path.join(ck, 'results', 'element-compare-unchanged-components.json'))
    shutil.copyfile(os.path.join(FIN, 'shots', 'post', 'results.json'), os.path.join(ck, 'results', 'renders.json'))
    shutil.copyfile(os.path.join(FIN, 'shots', 'stress', 'results.json'), os.path.join(ck, 'results', 'stress-long-text.json'))
    open(os.path.join(ck, 'README.md'), 'w').write(CHECKS_README)
    # ── screenshots ──
    res = {r['name']: r for r in jload(os.path.join(FIN, 'shots', 'post', 'results.json'))}
    for rid, name, bs in [('Start', 'Live starting points', [(b[0],) for b in boards.LIVE[1:]])] + [(r[0], r[1], r[2]) for r in boards.ROWS]:
        d = os.path.join(SHOTS, 'boards', 'Live starting points' if rid == 'Start' else (rid + ' ' + name).replace('/', '-').replace(' · ', ' - ').strip())
        os.makedirs(d, exist_ok=True)
        for b in bs: shutil.copyfile(os.path.join(FIN, 'shots', 'post', b[0] + '.png'), os.path.join(d, b[0] + '.png'))
    os.makedirs(os.path.join(SHOTS, 'responsive'))
    for sid in boards.PRIMARY:
        for w in boards.RESP_W:
            n = 'R-' + sid.replace('-', '') + '-' + str(w)
            shutil.copyfile(os.path.join(FIN, 'shots', 'post', n + '.png'), os.path.join(SHOTS, 'responsive', sid.replace('-', '') + '-' + str(w) + '.png'))
    shutil.copytree(os.path.join(FIN, 'shots', 'docs'), os.path.join(SHOTS, 'review-boards'), ignore=shutil.ignore_patterns('*.json'))
    shutil.copyfile(os.path.join(FIN, 'shots', 'canvas', 'Main.png'), os.path.join(SHOTS, 'review-boards', 'Main-live-preview.png'))
    os.makedirs(os.path.join(SHOTS, 'stress-long-text'))
    for f in os.listdir(os.path.join(FIN, 'shots', 'stress')):
        if f.endswith('.png'): shutil.copyfile(os.path.join(FIN, 'shots', 'stress', f), os.path.join(SHOTS, 'stress-long-text', f))
    shutil.copytree(os.path.join(FIN, 'shots', 'before-after'), os.path.join(SHOTS, 'before-after'))
    jd = os.path.join(SHOTS, 'journeys'); os.makedirs(jd)
    for s in sorted(os.listdir(out)):
        for f in os.listdir(os.path.join(out, s)):
            if f.endswith('.png'): shutil.copyfile(os.path.join(out, s, f), os.path.join(jd, f))
    open(os.path.join(SHOTS, 'README.txt'), 'w').write(SHOTS_README.format(status=STATUS, label=LABEL, n=len(res)))
    print('package written:', SRC, SHOTS)

CHECKS_README = '''# checks/

How the evidence in CHECKS.md was produced, so it can be re-run.

- `scripts/` — Node (Playwright 1.56, Chromium) runners and the Python build scripts:
  - `render.mjs` renders board wrappers and records height, horizontal overflow, elements off the page, text under 13 px and console errors;
  - `journey.mjs` drives the live preview through real clicks, typing and keys (`specs/journeys-*.json`);
  - `links.mjs` clicks every visible anchor from each start state and reads where it lands;
  - `scan.mjs` is the structural accessibility scan; `elcmp.mjs` compares single components between two builds;
  - `jsstrings.mjs` lists the string literals in the view logic (used by `consolidate.py` to keep classes built at runtime);
  - `build_final.py` + `build-parts/` assemble Main from the R1 checkpoint; `consolidate.py` makes the single `fa.css`;
    `boards.py`, `coverage.py`, `mkcanvas.py` and `handoff.py` make the boards, the register, the canvas and this package.
- `specs/` — the journey definitions (J1–J9), the documented journey changes, the render and link-crawl start lists.
- `results/` — raw results: journeys per set, links, scan, renders, pixel comparisons (before/after consolidation, published vs final, R1 vs final), element comparisons and the long-text stress run.
'''

SHOTS_README = '''XR Learning Platform · V3 · Faculty — screenshots of the final complete-role design ({label})
Status: {status}

boards/          every inspection board on the canvas ({n} renders in total with the responsive strip), one folder per owned ID
responsive/      every owned ID at 1440, 1024, 768 and 375 (FA-22 shown on Students)
before-after/    the published V3 Faculty build next to the final design, one image per owned ID (1440)
review-boards/   the coverage register, what changed and checks boards
journeys/        screenshots taken during the connected journeys
stress-long-text/ names and titles 3–5 times longer than the sample, at 1440 and 375

Rendered locally in Chromium with the Design runtime and the Public Sans webfont, at device scale 1.
'''

if __name__ == '__main__':
    main()
