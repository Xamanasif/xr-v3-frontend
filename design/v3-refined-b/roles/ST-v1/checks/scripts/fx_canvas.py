# Canvas index for the final design: page "final" (the one design to review and integrate) and page "history" (every earlier
# generation, unchanged files, relabelled as superseded). Reads the Version 9 index, the board spec, measured heights and notes.
import json, pathlib, sys, copy
P = pathlib.Path('/home/claude/work/project'); W = pathlib.Path('/home/claude/work')
old = json.loads((W / 'canvas-before-final.json').read_text())
rows = json.loads((W / 'fx_boards.json').read_text())
heights = json.loads(pathlib.Path(sys.argv[1]).read_text())
NOTES = json.loads((W / 'fx_notes.json').read_text())
c = copy.deepcopy(old)
c['title'] = 'XR Learning Platform — Design V3 · Student · complete role · final design'
c['pages'] = [{'id': 'final', 'name': 'Student · final design'}, {'id': 'history', 'name': 'History · superseded · do not integrate'}]
c['launch'] = {'view': 'canvas', 'page': 'final'}
for b in c['boards'].values(): b['page'] = 'history'
for n in c['notes'].values(): n['page'] = 'history'
c['boards']['StudentR2.dc.html']['title'] = 'History · R2 preview (live) · superseded by the final design · kept for reference'
for k in ('r2-title', 'c2-title', 'cp-title', 'prev-title'):
    c['notes'][k]['text'] = 'History · ' + c['notes'][k]['text']
c['notes']['r2-title']['text'] = 'History · Student R2 · consolidated into the final design (Final page) · kept for reference, not for integration'
c['notes']['hist-banner'] = {'x': 0, 'y': -480, 'text': 'History · everything on this page is superseded by the final design on the Final page · kept for reference · do not integrate', 'kind': 'title1', 'maxW': 3600, 'page': 'history'}
# ── final page ──────────────────────────────────────────────────────────────────────────────────────────────
c['notes']['f-title'] = {'x': 0, 'y': 0, 'text': NOTES['title'], 'kind': 'title1', 'maxW': 3600, 'page': 'final'}
c['boards']['StudentFinal.dc.html'] = {'x': 0, 'y': 260, 'w': 1440, 'h': 900, 'title': 'Final preview (live) · all 19 screens, every scenario and state from the review controls · start here', 'expand': 'fill', 'is_interactive': True, 'page': 'final'}
c['order'].append('StudentFinal.dc.html')
for i, (k, n) in enumerate(NOTES['stickies']):
    col, rw = i % 3, i // 3
    c['notes'][k] = {'x': 1520 + col * 560, 'y': 260 + rw * 700, 'w': 500, 'maxH': 640, 'text': n['text'], 'fill': n.get('fill', 'blue'), 'page': 'final'}
y = 260 + 700 * 2 + 140
for ri, r in enumerate(rows):
    width = sum(b['w'] for b in r['boards']) + 80 * (len(r['boards']) - 1)
    c['notes'][f'f-row-{ri:02d}'] = {'x': 0, 'y': y, 'text': r['title'], 'kind': 'title1', 'maxW': max(width, 1440), 'page': 'final'}
    x, top, mh = 0, y + 260, 0
    for b in r['boards']:
        h = heights[b['file']]
        c['boards'][b['file']] = {'x': x, 'y': top, 'w': b['w'], 'h': h, 'title': b['title'], 'expand': 'fill', 'is_interactive': True, 'page': 'final'}
        c['order'].append(b['file'])
        x += b['w'] + 80; mh = max(mh, h)
    y = top + mh + 160
(P / 'canvas.json').write_text(json.dumps(c, ensure_ascii=False, indent=1) + '\n')
nb = sum(1 for b in c['boards'].values() if b['page'] == 'final')
print('canvas.json boards', len(c['boards']), '(final page', nb, ') notes', len(c['notes']), '· final page height', y)
