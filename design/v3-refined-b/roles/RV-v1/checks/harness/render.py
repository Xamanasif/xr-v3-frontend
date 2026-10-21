#!/usr/bin/env python3
"""Render every board at its canvas frame width, capture it, and scan the rendered text for
internal technical IDs (SUB-/UPD-/REQ-/ACC-style) in user-facing copy."""
import sys, json, os, re
sys.path.insert(0, '/home/claude/h')
from playwright.sync_api import sync_playwright
import harness as H
FIN = '/home/claude/fin/project/'
OUT = '/home/claude/shots/boards'
os.makedirs(OUT, exist_ok=True)
cj = json.load(open(FIN + 'canvas.json'))
FRAME = ('confirm', 'account', 'drawer')
IDPAT = re.compile(r'\b(?:SUB|UPD|REQ|ACC)-\d{3,}\b')
TEXT_JS = """() => {
  const seen = [];
  const walk = n => { if (n.nodeType === 3) { const p = n.parentElement; if (p && getComputedStyle(p).display !== 'none') seen.push(n.textContent); return; }
    if (n.nodeType !== 1) return; const cs = getComputedStyle(n); if (cs.display === 'none') return;
    for (const a of ['aria-label','title','placeholder','alt','value']) { const v = n.getAttribute && n.getAttribute(a); if (v) seen.push(v); }
    n.childNodes.forEach(walk); };
  walk(document.body);
  return { text: seen.join(' | '), title: document.title };
}"""
res, hits = {}, {}
only = sys.argv[1:] or None
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, meta in cj['boards'].items():
        stem = name[:-len('.dc.html')]
        if only and stem not in only: continue
        w, fh = meta['w'], meta['h']
        logs, bad = [], []
        pg = H.new_page(b, w, 812 if w == 375 else 900, logs)
        pg.on('response', lambda r: bad.append(f'{r.status} {r.url}') if r.status >= 400 else None)
        pg.goto(H.BASE + '/fin/' + name); H.settle(pg, 600)
        o = H.overflow(pg)
        frame = any(k in name for k in FRAME)
        if not frame:
            pg.set_viewport_size({'width': w, 'height': max(812, o['docH'])}); pg.wait_for_timeout(250)
        t = pg.evaluate(TEXT_JS)
        found = sorted(set(IDPAT.findall(t['text'])) | set(IDPAT.findall(t['title'])))
        if found: hits[name] = found
        pg.evaluate('() => window.scrollTo(0, 0)')
        pg.screenshot(path=f'{OUT}/{stem}.png', full_page=not frame)
        errs = [l for l in logs if 'error' in l.lower()]
        docH = o['docH']
        fits = frame or (docH <= fh and docH + 40 >= fh)
        ok = o['scrollW'] <= o['clientW'] and not o['overflow'] and not errs and not bad and fits
        res[name] = {'w': w, 'frame': fh, 'docH': docH, 'overflow_ok': o['scrollW'] <= o['clientW'] and not o['overflow'],
                     'fits_frame': fits, 'console_errors': errs[:3], 'failed_requests': bad[:3], 'ids': found}
        print(('OK  ' if ok else 'BAD ') + f'{stem:22s} w={w:5d} doc={docH:5d} frame={fh:5d}' + ('' if ok else f"  {o['overflow'][:2]} {errs[:1]} {bad[:1]} fits={fits}") + (f'  IDS={found}' if found else ''))
        pg.context.close()
    b.close()
old = {}
try: old = json.load(open(OUT + '/render.json'))
except Exception: pass
old.update(res); json.dump(old, open(OUT + '/render.json', 'w'), indent=1)
print(f'== {len(res)} boards rendered; boards with user-facing IDs: {len(hits)}')
for k, v in hits.items(): print('   ', k, v)
