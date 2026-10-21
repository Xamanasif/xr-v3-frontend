# Final journeys: the R1 journey specs (J1–J8) adapted to the consolidated build, plus J9 for the final pass.
#   python3 journeys.py build      -> harness/tw-fj root wrappers + checks/journeys/*.json (renamed selectors + documented changes)
#   python3 journeys.py run [set]  -> runs every set (or one) against final/project, results in checks/journeys/out/<set>/
import json, os, re, sys, subprocess, html, copy
FIN = os.path.dirname(os.path.abspath(__file__))
SP = os.path.dirname(FIN)
TW = os.path.join(SP, 'harness', 'tw-fj')
OUT = os.path.join(FIN, 'checks', 'journeys')
R1SPECS = os.path.join(SP, 'r1', 'specs')
RENAME = json.load(open(os.path.join(FIN, 'rename-map.json')))
TOK = re.compile(r'(?<![\w-])fr-[a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-z0-9]+)?(?:-)?')
CSS = ['core.css', 'rb.css', 'rb-kit.css', 'fa.css']

ROOTS = {  # file -> (scenario, start, rec, preset)
 'T-j-al': ('nov07', 'FA-06', '', ''), 'T-j-co': ('coteach', 'FA-01', '', ''), 'T-j-dr': ('nov07', 'FA-14', '', ''),
 'T-j-drfail': ('nov07', 'FA-16', '', 'dr-failnext'), 'T-j-exps': ('nov07', 'FA-04', '', ''), 'T-j-none': ('none', 'FA-01', '', ''),
 'T-j-nov07-375': ('nov07', 'FA-01', '', ''), 'T-j-nov07': ('nov07', 'FA-01', '', ''), 'T-j-nov15': ('nov15', 'FA-18', '', ''),
 'T-j-oct26': ('oct26', 'FA-01', '', ''), 'T-j-qb': ('nov07', 'FA-14', '', ''), 'T-j-qb2': ('nov07', 'FA-14', '', ''),
 'T-j-set': ('nov07', 'FA-10', 'ASMT-0009', ''), 'T-r1-new': ('new', 'FA-01', '', ''),
 'T-j-new': ('new', 'FA-01', '', ''), 'T-j-mq': ('nov07', 'FA-18', '', ''), 'T-j-im': ('nov07', 'FA-17', '', ''),
 'T-j-sl': ('nov07', 'FA-20', '', ''), 'T-j-asm': ('nov07', 'FA-08', '', ''),
}
SETS = ['j-1440', 'j-narrow', 'j5', 'j6', 'j6-375', 'j7', 'j8', 'j8-narrow']

def wrap(name, sc, st, rec, pre):
    links = ''.join('<link rel="stylesheet" href="./%s">\n' % c for c in CSS)
    return ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
      '<title>' + name + '</title>\n<script src="./support.js"></script>\n' + links +
      '</head>\n<body>\n<x-dc>\n<helmet>\n<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400..800&amp;display=swap" rel="stylesheet">\n<style>\nbody{margin:0;background:#F3F4F9}\n</style>\n</helmet>\n'
      '<dc-import name="Main" scenario="' + sc + '" start="' + st + '" rec="' + rec + '" preset="' + pre + '" hint-size="100%,900px"></dc-import>\n</x-dc>\n'
      "<script type=\"text/x-dc\" data-dc-script data-props='{\"$preview\":{\"width\":1440,\"height\":900}}'>\n// journey root\nclass Component extends DCLogic { renderVals() { return {}; } }\n</script>\n</body>\n</html>\n")

# Owner decision (21 Oct 2026) — internal technical IDs leave ordinary user-facing labels. These literal re-pointings
# are applied to every journey step: the facts checked are the same, only the label that carries them changed.
# Element ids (#fa-mk-Q-0106, #fa-qb-del-Q-0101 …) are stable keys and are deliberately NOT re-pointed.
ID_REPOINT = [
 ('Moved Q-0104 to position 2.', 'Moved question 3 to position 2.'),
 ('Saved to your question bank as Q-0107.', 'Saved to your question bank.'),
 ('Saved as version 2 of Q-0102.', 'Saved as version 2.'),
 ('Added to your question bank as Q-0107.', 'Added to your question bank.'),
 ('Added to your question bank as Q-0108.', 'Added to your question bank.'),
 ('8 questions were added to your bank as Q-0109 to Q-0116. None is in an assessment yet.', '8 questions were added to your bank. None is in an assessment yet.'),
 ('8 questions were added to your bank as Q-0107 to Q-0114.', '8 questions were added to your bank.'),
 ('Q-0103 deleted from your question bank.', 'Question deleted from your question bank.'),
 ('Delete Q-0103?', 'Delete this question?'),
 ('Q-0101 removed from this assessment. It is still in your question bank.', 'Question removed from this assessment. It is still in your question bank.'),
 ('Q-0102 now uses the version in your bank.', 'Question 2 now uses the version in your bank.'),
 ('Q-0109 added as question 5.', 'Added as question 5.'),
 ('Add Q-0109 to this assessment', 'Add to this assessment: Which quantity is the ratio C_min ÷ C_max?'),
 ('Q-0107 saved to your question bank.', 'Saved to your question bank.'),
 ('Q-0107 · True or false · 2 marks', 'True or false · 2 marks'),
 ('Q-0102 · Single choice · version 2', 'Single choice'),
 ('Exported submissions-ASMT-0009.csv · 2 rows', 'Exported submissions-heat-exchanger-post-lab.csv · 2 rows'),
 ('Mark Rahul Verma, ATT-0450', 'Mark Rahul Verma'),
 ('Mark Priya Natarajan, ATT-0451', 'Mark Priya Natarajan'),
 ('View marks for Rahul Verma, ATT-0450', 'View marks for Rahul Verma'),
 ('Edit Q-0102', 'Edit question: How is the number of transfer units (NTU) defined?'),
 ('Edit Q-0103', 'Edit question: In a counter-flow exchanger, what can happen that cannot happen in parallel flow?'),
 ('Remove question 1, Q-0101, from this assessment', 'Remove question 1 from this assessment'),
 ('Use the updated version of Q-0102', 'Use the updated version of question 2'),
]

def repoint(x):
    for a, b in ID_REPOINT:
        x = x.replace(a, b)
    return x

def ren(s):
    return TOK.sub(lambda m: RENAME.get(m.group(0), 'fa-' + m.group(0)[3:]), s)

def renamed(step):
    st = copy.deepcopy(step)
    for k in ('click', 'fill', 'select', 'focus', 'upload', 'assert'):
        if isinstance(st.get(k), str): st[k] = repoint(ren(st[k]))
    for k in ('expect', 'expectNot'):
        if isinstance(st.get(k), str): st[k] = repoint(st[k])
        elif isinstance(st.get(k), list): st[k] = [repoint(v) if isinstance(v, str) else v for v in st[k]]
    return st

def build():
    os.makedirs(TW, exist_ok=True); os.makedirs(OUT, exist_ok=True)
    for n, (sc, st, rec, pre) in ROOTS.items():
        open(os.path.join(TW, n + '.dc.html'), 'w').write(wrap(n, sc, st, rec, pre))
    changes = json.load(open(os.path.join(FIN, 'journey-changes.json'))) if os.path.exists(os.path.join(FIN, 'journey-changes.json')) else []
    applied = 0
    for s in SETS:
        js = json.load(open(os.path.join(R1SPECS, s + '.json')))
        for j in js:
            j['steps'] = [renamed(x) for x in j['steps']]
            for c in changes:
                if not j['name'].startswith(c['family']): continue
                for x in j['steps']:
                    if x.get('label') != c['label']: continue
                    hit = False
                    for k, (a, b) in c['set'].items():
                        if a is None or x.get(k) == a:
                            x[k] = b; hit = True
                    if hit: applied += 1; c.setdefault('_hits', []).append(j['name'])
        json.dump(js, open(os.path.join(OUT, s + '.json'), 'w'), indent=1, ensure_ascii=False)
    extra = os.path.join(FIN, 'journeys-j9.json')
    if os.path.exists(extra):
        json.dump(json.load(open(extra)), open(os.path.join(OUT, 'j9.json'), 'w'), indent=1, ensure_ascii=False)
    print('roots', len(ROOTS), 'sets', len(SETS), 'changes applied', applied)
    for c in changes: print('  ', c['family'], '·', c['label'], '→', c.get('_hits', 'NOT APPLIED'))

IDGUARD = ("(() => { const RE = /\\b(ASMT|ATT|SUP|REQ|ACC|UPD|DTR|SUB)-\\d+|\\bQ-\\d{3,}|\\bD-\\d\\b/;"
           " const R = document.getElementById('dc-root') || document.body;"
           " if (RE.test(R.innerText || '')) return false;"
           " const els = R.querySelectorAll('*');"
           " for (const el of els) { for (const a of ['aria-label', 'title', 'placeholder', 'alt']) { const v = el.getAttribute(a);"
           " if (v && RE.test(v)) return false; } if (el.classList.contains('xr-sr') && RE.test(el.textContent || '')) return false; }"
           " return true; })()")
# J10: the chains that produce messages, notices and dialogs, re-run with an internal-ID guard on every step.
IDGUARD_JOURNEYS = ['J1-create-chain', 'J2-bank-chain', 'J3-marking-chain', 'J4-students-followup', 'J4b-coteacher-refusals',
                    'J5c-delete-dialog', 'J5d-released-15-nov', 'J6-draft-with-assistance', 'J7a-settings-and-questions',
                    'J9b-assessment-record', 'J9d-bank-drafts-and-editor', 'J9e-queue-and-students', 'J9f-import-figures']

def idguard():
    out = []
    for s in SETS + (['j9'] if os.path.exists(os.path.join(OUT, 'j9.json')) else []):
        for j in json.load(open(os.path.join(OUT, s + '.json'), encoding='utf-8')):
            if j['name'] not in IDGUARD_JOURNEYS: continue
            steps = []
            for st in j['steps']:
                st = dict(st)
                st['assert'] = '(' + st['assert'] + ') && ' + IDGUARD if st.get('assert') else IDGUARD
                st['label'] = (st.get('label') or 'step') + ' · no internal ID on screen or in any accessible name'
                st.pop('shot', None)
                steps.append(st)
            out.append({'name': 'J10-' + j['name'], 'file': j['file'], 'width': j.get('width', 1440), 'steps': steps})
    json.dump(out, open(os.path.join(OUT, 'j10.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print('j10:', len(out), 'journeys,', sum(len(j['steps']) for j in out), 'guarded steps')

def run(only=None):
    sets = SETS + [x for x in ('j9', 'j10') if os.path.exists(os.path.join(OUT, x + '.json'))]
    for s in sets:
        if only and s != only: continue
        out = os.path.join(OUT, 'out', s)
        env = dict(os.environ, TW_DIR='tw-fj', FA_DIR=os.path.join(FIN, 'project'))
        r = subprocess.run(['node', os.path.join(SP, 'tools', 'journey.mjs'), os.path.join(SP, 'harness'), os.path.join(OUT, s + '.json'), out], env=env, capture_output=True, text=True, timeout=1200)
        print(r.stdout[-5000:]); print(r.stderr[-2000:])

if __name__ == '__main__':
    if sys.argv[1] == 'build': build(); idguard()
    elif sys.argv[1] == 'idguard': idguard()
    elif sys.argv[1] == 'run': run(sys.argv[2] if len(sys.argv) > 2 else None)
