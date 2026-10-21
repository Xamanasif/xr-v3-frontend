# FINAL source package for the Student role: the docs at the root, project/ (the one final design only), checks/ (build inputs,
# review scripts, raw results). Earlier generations are not included: they stay on the canvas History page.
# usage: python3 -I fx_srczip.py <zip path>
import pathlib, zipfile, json, sys, hashlib
W = pathlib.Path('/home/claude/work'); P = W / 'project'; D = W / 'delivery-final'; S = pathlib.Path('/home/claude/scripts'); SF = S / 'final'
R = pathlib.Path('/tmp/claude-0/fx/run'); FX = pathlib.Path('/tmp/claude-0/fx')
z = pathlib.Path(sys.argv[1]); root = z.stem + '/'
STATUS = json.loads((D / 'status.json').read_text())
DOCS = ['START-HERE.md', 'COVERAGE-REGISTER.md', 'COVERAGE-REGISTER.json', 'CONSOLIDATION-LEDGER.md', 'ROLE-STATUS.json', 'HANDOFF.md', 'COMPONENT-EXTENSIONS.md',
        'FOUNDATION-LOCK.json', 'LINK-MAP.json', 'SCENARIOS.json', 'CHECKS.md']
rows = json.loads((W / 'fx_boards.json').read_text()); boards = [b['file'] for r in rows for b in r['boards']]
PROJECT = ['StudentFinal.dc.html', 'v3-student-final.css', 'core.css', 'rb.css', 'rb-kit.css'] + boards
SKIP = ('fx_probe', 'fx_residue', 'pick.py')
NOISE = ('agent-proxy', 'connect_rejected', 'Allowed domains are set', '__agentproxy', '(oldest ', 'connections through the agent proxy')
README = f"""# checks/ · how the final Student design was built and verified

Status of this package: {STATUS['statusLine']}.

- `build/`: the inputs that reproduce `project/StudentFinal.dc.html` and `project/v3-student-final.css`. `Main.dc.html` (the original design, its logic carried verbatim) and `v3-student.css` (the source of Part A) are build inputs only, not designs to implement. `final-src/` holds the final templates, view models and the Part B stylesheet. Run `fx_build.py`, then `fx_consolidate.py`.
- `scripts/`: the review scripts behind `CHECKS.md` (rendering, journeys, logic parity, links, accessibility, keyboard, hover, states, scroll containers, full-width buttons, stress, boards, documents). They use the original workspace paths and need the Claude Design host's runtime file, which is not included and must never ship.
- `results/`: the raw results those scripts wrote (JSON and logs; images are in the screenshot archive).
"""
n = 0
with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
    def add(p, arc):
        global n
        p = pathlib.Path(p)
        if p.suffix in ('.log', '.txt', '.err'):
            t = p.read_bytes().replace(b'\x00', b'').decode('utf-8', 'replace')
            zf.writestr(root + arc, '\n'.join(l for l in t.splitlines() if not any(x in l for x in NOISE)) + '\n')
        else: zf.write(p, root + arc)
        n += 1
    for d in DOCS: add(D / d, d)
    for f in PROJECT: add(P / f, 'project/' + f)
    add(D / 'canvas-package.json', 'project/canvas.json')                      # the Final page only
    zf.writestr(root + 'checks/README.md', README); n += 1
    for f in ['Main.dc.html', 'v3-student.css']: add(P / f, 'checks/build/' + f)
    for p in sorted((W / 'final-src').iterdir()):
        if p.is_file(): add(p, 'checks/build/final-src/' + p.name)
    for f in ['fx_build.py', 'fx_consolidate.py']: add(SF / f, 'checks/build/' + f)
    add(S / 'r2_regions.py', 'checks/build/r2_regions.py')
    for p in sorted(SF.iterdir()):
        if p.is_file() and not p.name.startswith(SKIP) and p.suffix in ('.py', '.mjs', '.sh'): add(p, 'checks/scripts/' + p.name)
    add(S / 'harness.mjs', 'checks/scripts/harness.mjs'); add(S / 'r2_regions.py', 'checks/scripts/r2_regions.py')
    for f in ['fxcases.json', 'fxcases-320.json', 'fx_boards.json', 'fx_notes.json']: add(W / f, 'checks/results/' + f)
    for f in ['final-build.json', 'eye.json', 'identity/identity.json']: add(FX / f, 'checks/results/' + f)
    for p in sorted(R.rglob('*')):
        if p.is_file() and p.suffix in ('.json', '.log', '.txt') and not p.name.endswith('.done'): add(p, 'checks/results/run/' + str(p.relative_to(R)))
# sanity: no runtime file, no earlier generation, every final file present and identical to the project
with zipfile.ZipFile(z) as zf:
    names = zf.namelist()
    assert not any(x.endswith(('support.js', 'dc-runtime.js')) for x in names), 'runtime file in the package'
    assert not any(('/project/' in x) and any(k in x.split('/')[-1] for k in ('R2-', 'C2-', 'CP0', 'MainC2', 'MainRefined', 'StudentR2', 'v3-student-r2', 'v3-student-c2', 'v3-student-refine', 'ST0', 'ST1', 'XS0', 'MENU-')) for x in names), 'earlier generation in project/'
    for f in PROJECT:
        assert hashlib.sha256(zf.read(root + 'project/' + f)).hexdigest() == hashlib.sha256((P / f).read_bytes()).hexdigest(), f
print(z, z.stat().st_size, 'bytes,', n, 'files ·', sum(1 for x in names if '/project/' in x), 'in project/')
