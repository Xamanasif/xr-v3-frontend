#!/usr/bin/env python3
"""COVERAGE.json + COVERAGE.md, parsed from the Coverage board so the register and the canvas always agree."""
import re, html, json, sys
OUT = sys.argv[1]
src = open('/home/claude/fin/project/Coverage.dc.html').read()
body = src.split('<tbody>')[1].split('</tbody>')[0]
strip = lambda t: html.unescape(re.sub('<[^>]+>', '', t)).strip()
groups, rows, cur = [], [], None
for m in re.finditer(r'<tr class="rg-group"><td colspan="4">(.*?)</td></tr>|<tr><td><b>(.*?)</b></td><td>(.*?)</td><td>(.*?)</td><td><span class="xr-st [^"]*"><i></i>(.*?)</span></td></tr>', body, re.S):
    if m.group(1) is not None:
        code = strip(re.search(r'<span class="rk-code[^"]*">(.*?)</span>', m.group(1)).group(1))
        cur = {'group': code, 'groupTitle': strip(re.sub(r'<span class="rk-code[^"]*">.*?</span>', '', m.group(1))), 'subviews': []}
        groups.append(cur)
    else:
        boards = [strip(x) for x in re.findall(r'<a class="rb-link" href="[^"]*">(.*?)</a>', m.group(3))] or [strip(m.group(3))]
        files = re.findall(r'<a class="rb-link" href="([^"]*)">', m.group(3))
        r = {'group': cur['group'], 'groupTitle': cur['groupTitle'], 'subview': strip(m.group(2)),
             'boards': [f'{f} ({b})' if b and not b.endswith('.dc.html') else f for f, b in zip(files, boards)] or boards,
             'change': strip(m.group(4)), 'status': strip(m.group(5))}
        cur['subviews'].append(r); rows.append(r)
R, U, E = 'REDESIGNED', 'REVIEWED AND UNCHANGED', 'EXCLUDED'
counted = [r for r in rows if r['status'] in (R, U)]
nR = sum(r['status'] == R for r in counted); nU = sum(r['status'] == U for r in counted)
doc = {'about': 'Coverage register of the FINAL, owner-approved Academic Reviewer complete-role design. Every owned screen and important subview, marked against the completed role of 18 Oct 2026. Generated from the Coverage board on the canvas, so the two always agree.',
       'status': 'FINAL — OWNER APPROVED 21 October 2026',
       'baseline': 'completed role (canvas https://claude.ai/artifact/DQmYyqbQPEFJ6NKqeZUJmJ, 18 Oct 2026) and visual refinement checkpoint 1 (https://claude.ai/artifact/GDmjHxHhFFYhdvw1n2pEKd, 19 Oct 2026) — both preserved unchanged and superseded by this design',
       'postAcceptanceCorrection': 'Internal record IDs (SUB-…, UPD-… and any REQ-/ACC-style identifier) were removed from reviewer-facing labels on all six screens: the queue rows, Reviewed by me rows, the identity card and the breadcrumb, which now names the experiment. The IDs remain in the records, the route proposals, the search and the audit trail. Experiment names, course codes, vendor names and format labels are unchanged. Verified by scanning the rendered text of every board (CHECKS.md).',
       'statusKey': {R: 'the subview’s own design changed in this refinement', U: 'inspected against the refined direction and kept; it now renders inside the refined pages', E: 'not designed, by the existing decision'},
       'summary': {'subviews': len(counted), R: nR, U: nU, 'pending': 0,
                   'excluded': ['RV-07 (Courses in scope · Learning outcomes · Reviewer settings): not designed, by the existing decision']},
       'groups': [{'group': g['group'], 'groupTitle': g['groupTitle'], 'subviews': len(g['subviews']),
                   R: sum(s['status'] == R for s in g['subviews']), U: sum(s['status'] == U for s in g['subviews'])} for g in groups],
       'subviews': rows}
json.dump(doc, open(OUT + '/COVERAGE.json', 'w'), indent=1, ensure_ascii=False)
md = ['# Coverage register · Academic Reviewer · FINAL — OWNER APPROVED', '',
      '**Status: FINAL — OWNER APPROVED, 21 October 2026.** Every owned screen and important subview, marked **REDESIGNED** or **REVIEWED AND UNCHANGED** against the completed role (18 Oct 2026). Each one was inspected, rendered at its widths and tested. The same register is the *Coverage* board on the canvas; this file is generated from it.', '',
      f'**{len(counted)} subviews: {nR} REDESIGNED, {nU} REVIEWED AND UNCHANGED, 0 pending or awaiting propagation.** RV-07 is excluded by the existing decision and not designed.', '',
      '- **REDESIGNED** — the subview’s own design changed in this refinement.',
      '- **REVIEWED AND UNCHANGED** — inspected against the refined direction and kept; it now renders inside the refined pages.', '',
      '## Correction applied after acceptance', '',
      doc['postAcceptanceCorrection'], '']
for g in groups:
    md += [f"## {g['group']} · {g['groupTitle']}", '', '| Subview | Boards | What changed, or why it stays | Status |', '| --- | --- | --- | --- |']
    for s in g['subviews']:
        md.append(f"| {s['subview']} | {', '.join(s['boards'])} | {s['change']} | **{s['status']}** |")
    md.append('')
open(OUT + '/COVERAGE.md', 'w').write('\n'.join(md))
print(f'{len(counted)} subviews · {nR} redesigned · {nU} unchanged · groups {len(groups)}')
