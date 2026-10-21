# Final Student delivery docs (generated parts): FOUNDATION-LOCK.json, ROLE-STATUS.json, LINK-MAP.json, SCENARIOS.json,
# and the final-only canvas index used inside the package. Run after the verification lanes and fx_register.py.
import json, hashlib, pathlib, copy, re
W = pathlib.Path('/home/claude/work'); P = W / 'project'; D = W / 'delivery-final'; R = pathlib.Path('/tmp/claude-0/fx/run')
OLD, R2 = W / 'delivery', W / 'delivery-r2'
sha = lambda p: hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
lock0 = json.loads((OLD / 'FOUNDATION-LOCK.json').read_text()); lr2 = json.loads((R2 / 'FOUNDATION-LOCK.json').read_text())
rows = json.loads((W / 'fx_boards.json').read_text()); fb = [b for r in rows for b in r['boards']]
STATUS = json.loads((D / 'status.json').read_text())          # one place for the approval status
# ── FOUNDATION-LOCK.json ──────────────────────────────────────────────────────────────────────────────────────
lock = {
 'foundationId': lock0['foundationId'], 'role': 'Student', 'version': 'Student · final design · ' + STATUS['label'],
 'baseFiles': {k: {**v, 'finalSha256': sha(P / k.split('/', 1)[1]), 'byteIdentical': sha(P / k.split('/', 1)[1]) == v['originalSha256']} for k, v in lock0['baseFiles'].items()},
 'packReferenceFilesUnchanged': lock0['packReferenceFilesUnchanged'], 'packReferenceCheck': lock0['packReferenceCheck'],
 'final': {
   'previewRoot': {'project/StudentFinal.dc.html': sha(P / 'StudentFinal.dc.html')},
   'roleStylesheet': {'project/v3-student-final.css': sha(P / 'v3-student-final.css')},
   'boards': {('project/' + b['file']): sha(P / b['file']) for b in fb},
   'loads': ['core.css', 'rb.css', 'rb-kit.css', 'v3-student-final.css'],
   'buildInput': {'checks/build/Main.dc.html': sha(P / 'Main.dc.html'), 'note': 'the original design; its logic is carried verbatim; not a design to implement'}},
 'historyUnchangedAndNotInThisPackage': {
   'original': {'project/Main.dc.html': sha(P / 'Main.dc.html'), 'project/v3-student.css': sha(P / 'v3-student.css'), 'boards': len(lock0['localAdditions']['inspectionBoards']),
                'allMatchTheOriginalLock': sha(P / 'Main.dc.html') == lock0['localAdditions']['rolePreviewRoot']['project/Main.dc.html'] and sha(P / 'v3-student.css') == lock0['localAdditions']['stylesheet']['project/v3-student.css'] and all(sha(P / k.split('/', 1)[1]) == v for k, v in lock0['localAdditions']['inspectionBoards'].items())},
   'checkpoint1': {'allMatch': all(sha(P / k.split('/', 1)[1]) == v for k, v in ({kk: vv for kk, vv in lr2['earlierCheckpointsUnchanged']['checkpoint1'].items() if kk != 'boards'} | lr2['earlierCheckpointsUnchanged']['checkpoint1']['boards']).items())},
   'checkpoint2': {'allMatch': all(sha(P / k.split('/', 1)[1]) == v for k, v in ({kk: vv for kk, vv in lr2['earlierCheckpointsUnchanged']['checkpoint2'].items() if kk != 'boards'} | lr2['earlierCheckpointsUnchanged']['checkpoint2']['boards']).items())},
   'r2': {'project/StudentR2.dc.html': sha(P / 'StudentR2.dc.html'), 'project/v3-student-r2.css': sha(P / 'v3-student-r2.css'),
          'allMatch': all(sha(P / k.split('/', 1)[1]) == v for k, v in (lr2['r2Additions']['previewRoot'] | lr2['r2Additions']['stylesheet'] | lr2['r2Additions']['boards']).items())}},
 'notIncluded': lock0['notIncluded'],
 'rules': 'Foundation byte-identical. The final is additive: one preview root, one role stylesheet (Part A verbatim from v3-student.css, Part B sv- components; no custom properties; colours from the base files), 143 boards and the canvas index. Every earlier file is byte-identical and kept on the canvas History page.'}
(D / 'FOUNDATION-LOCK.json').write_text(json.dumps(lock, indent=1, ensure_ascii=False) + '\n')
# ── ROLE-STATUS.json ──────────────────────────────────────────────────────────────────────────────────────────
reg = json.loads((D / 'COVERAGE-REGISTER.json').read_text())
rs0 = json.loads((OLD / 'ROLE-STATUS.json').read_text())
by0 = {s['id']: s for s in rs0['screens']}
screens = []
for e in reg['owned']:
    s0 = by0.get(e['id'], {})
    screens.append({'id': e['id'], 'screen': e['screen'], 'type': e['type'], 'navigation': e['navigation'], 'v46RouteProposal': s0.get('v46RouteProposal'), 'v46Boards': s0.get('v46Boards'),
                    'source': 'project/StudentFinal.dc.html', 'designComplete': True, 'connectedPreview': True, 'coverageStatus': e['status'],
                    'subviews': [{'subview': r['subview'], 'name': r['name'], 'status': r['status']} for r in e['subviews']],
                    'boards': sorted({b for r in e['subviews'] for b in r['boards']}), 'rendered': '1440 · 1024 · 768 · 375 (every case), 320 (subset)', 'logicTested': e['verification']['journeys'],
                    'ownerApproval': STATUS['ownerApproval']})
rs = {'role': rs0['role'], 'foundation': rs0['foundation'], 'ownedIds': rs0['ownedIds'], 'excluded': rs0['excluded'],
      'status': STATUS['statusLine'], 'statusKey': {'DESIGN COMPLETE': 'every owned ID and subview designed in the final design', 'CONNECTED PREVIEW COMPLETE': 'reachable and working inside StudentFinal.dc.html',
      'ASSEMBLY PENDING XS': 'account menu, Help and shared messages are faithful borrowed versions until the XS components are delivered', 'OWNER APPROVAL': STATUS['ownerApprovalNote']},
      'liveEntry': 'project/StudentFinal.dc.html — canvas Final page, “Final preview (live) · start here”', 'screens': screens}
(D / 'ROLE-STATUS.json').write_text(json.dumps(rs, indent=1, ensure_ascii=False) + '\n')
(D / 'SCENARIOS.json').write_text((OLD / 'SCENARIOS.json').read_text())
# ── LINK-MAP.json ─────────────────────────────────────────────────────────────────────────────────────────────
lm = json.loads((R / 'linkmap.json').read_text()); lk = json.loads((R / 'links.json').read_text())
EXERCISED = {('ST-01', 'ST-03'), ('ST-03', 'ST-05'), ('ST-05', 'ST-06'), ('ST-06', 'ST-07'), ('ST-07', 'ST-08'), ('ST-08', 'ST-08a'), ('ST-08a', 'ST-08'), ('*', 'ST-15'),
             ('ST-08', 'ST-16'), ('ST-16', 'ST-17'), ('*', 'ST-01'), ('*', 'ST-11'), ('ST-11', 'ST-12'), ('ST-12', 'ST-13'), ('ST-13', 'ST-14'), ('ST-11', 'ST-11sub'),
             ('ST-07', 'ST-09'), ('ST-09', 'ST-18'), ('ST-09ar', 'ST-08'), ('ST-19', 'ST-05'), ('ST-05', 'ST-15'), ('*', 'ST-02')}
n = {'in-role': 0, 'shared': 0, 'in-page': 0, 'unresolved': 0}; pairs = set(); ex = set()
for key, c in lm['cases'].items():
    for l in c['links']:
        dest = l['lands'].split(' ')[0]
        l['class'] = 'in-page' if l['lands'] == 'in-page anchor' else 'shared' if dest.startswith('XS-') else 'unresolved' if l['lands'] == 'unresolved' else 'in-role'
        n[l['class']] += 1
        src = c['screen']
        tested = (src, dest) in EXERCISED or (l['where'] == 'shell' and ('*', dest) in EXERCISED)
        l['tested'] = 'exercised in a journey' if tested else ('rendered; destination resolved by the routing rule' if l['class'] != 'unresolved' else 'UNRESOLVED')
        pairs.add((c['scenario'], src, dest))
        if tested: ex.add((src, dest))
lost = {}
for k, v in lk.items():
    for x in v['lost']: lost.setdefault(x['href'] + ' ‹' + x['name'] + '›', []).append(k)
lm['method'] = lm['method'] + ' Each link carries a class (in-role, shared XS surface, in-page anchor) and its tested status: exercised in a scripted journey, or rendered with its destination resolved by the preview’s own routing rule.'
lm['summary'].update({'byClass': n, 'uniqueScenarioSourceDestination': len(pairs), 'sourceDestinationPairsExercisedInJourneys': sorted('%s → %s' % p for p in ex)})
lm['originalComparison'] = {'method': 'Main.dc.html (the original design) and StudentFinal.dc.html rendered for the same 155 cases at 1440, 1024, 768 and 375; links compared by destination, buttons by name.',
  'casesWhereAnOriginalDestinationIsNotOnTheFinalPage': sorted({k.split('@')[0] for k, v in lk.items() if v['lost']}),
  'originalDestinationsNotOnTheFinalPage': {k: sorted(set(v)) for k, v in lost.items()},
  'originalButtonsNotOnTheFinalPage': sorted({b for v in lk.values() for b in v['lostB']})}
(D / 'LINK-MAP.json').write_text(json.dumps(lm, indent=1, ensure_ascii=False) + '\n')
# ── the package's canvas index: the Final page only ───────────────────────────────────────────────────────────
c = json.loads((P / 'canvas.json').read_text())
pk = copy.deepcopy(c)
pk['boards'] = {k: v for k, v in c['boards'].items() if v.get('page') == 'final'}
pk['order'] = [k for k in c['order'] if k in pk['boards']]
pk['notes'] = {k: v for k, v in c['notes'].items() if v.get('page') == 'final'}
pk['pages'] = [p for p in c['pages'] if p['id'] == 'final']
(D / 'canvas-package.json').write_text(json.dumps(pk, ensure_ascii=False, indent=1) + '\n')
print('docs written · links by class', n, '· exercised pairs', len(ex), '· lost destinations', list(lost)[:6])
