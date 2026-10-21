#!/usr/bin/env python3
"""Render every canvas board at its own frame width: full-page screenshot (from the top), document height,
horizontal overflow and console. usage: boards.py [name-filter]"""
import sys, json, os
sys.path.insert(0, '/home/claude/tools')
from playwright.sync_api import sync_playwright
import harness as H

BOARDS = [
 ('Main.dc.html', 1440), ('RV.dc.html', 1440), ('RV-375.dc.html', 375),
 ('RV01-1024.dc.html', 1024), ('RV01-768.dc.html', 768), ('RV01-375.dc.html', 375), ('RV01-calm.dc.html', 1440),
 ('RV02.dc.html', 1440), ('RV02-1024.dc.html', 1024), ('RV02-768.dc.html', 768), ('RV02-375.dc.html', 375),
 ('RV02-filtered.dc.html', 1440), ('RV02-nomatch.dc.html', 1024), ('RV02-loading.dc.html', 1024), ('RV02-failed.dc.html', 1024), ('RV02-empty.dc.html', 1024),
 ('RV05.dc.html', 1440), ('RV05-1024.dc.html', 1024), ('RV05-768.dc.html', 768), ('RV05-375.dc.html', 375), ('RV05-updates.dc.html', 1440), ('RV05-empty.dc.html', 1024),
 ('RV03.dc.html', 1440), ('RV03-1024.dc.html', 1024), ('RV03-768.dc.html', 768), ('RV03-375.dc.html', 375),
 ('RV03-notready.dc.html', 1440), ('RV03-recheck.dc.html', 1440), ('RV03-return-errors.dc.html', 1440), ('RV03-return-filled.dc.html', 1440),
 ('RV03-confirm.dc.html', 1440), ('RV03-approved.dc.html', 1440), ('RV03-returned.dc.html', 1440), ('RV03-editing-375.dc.html', 375),
 ('RV04.dc.html', 1440), ('RV04-1024.dc.html', 1024), ('RV04-768.dc.html', 768), ('RV04-375.dc.html', 375),
 ('RV04-confirm.dc.html', 1440), ('RV04-approved.dc.html', 1440), ('RV04-return-errors.dc.html', 1440), ('RV04-returned.dc.html', 1440), ('RV04-stale.dc.html', 1440), ('RV04-stale-armed.dc.html', 1440),
 ('RV06.dc.html', 1440), ('RV06-375.dc.html', 375), ('RV06-returned.dc.html', 1440), ('RV06-update.dc.html', 1440), ('RV06-elsewhere.dc.html', 1440),
 ('RV-scope.dc.html', 1440), ('RV-scope-375.dc.html', 375), ('RV-unavailable.dc.html', 1440), ('RV-scope-withdrawn.dc.html', 1440),
 ('RV-account.dc.html', 1440), ('RV-drawer-375.dc.html', 375), ('RV-help.dc.html', 1440), ('RV-report-375.dc.html', 375), ('RV-report-sent.dc.html', 1440), ('RV-signedout.dc.html', 1440),
]
OUT = '/home/claude/shots/boards'
os.makedirs(OUT, exist_ok=True)

if __name__ == '__main__':
    flt = sys.argv[1] if len(sys.argv) > 1 else ''
    res = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        for f, w in BOARDS:
            if flt and flt not in f: continue
            path = '/tmp/claude-0/-home-claude/f99a1275-7610-5182-8624-21a078c24de9/scratchpad/rvcanvas/project/' + f
            if not os.path.exists(path):
                print('MISSING', f); continue
            logs = []
            h = 812 if w == 375 else 900
            pg = H.new_page(b, w, h, logs)
            pg.goto(H.BASE + '/proj/' + f)
            H.settle(pg, 700)
            o = H.overflow(pg)
            # second pass at the frame height, as the canvas shows the board (100vh = frame height)
            pg.set_viewport_size({'width': w, 'height': max(h, o['docH'])})
            pg.wait_for_timeout(250)
            pg.evaluate("() => window.scrollTo(0, 0)")
            pg.screenshot(path=f'{OUT}/{f.replace(".dc.html", "")}.png', full_page=True)
            ok = o['scrollW'] <= o['clientW'] and not o['overflow']
            bad = [l for l in logs if 'error' in l.lower()]
            res[f] = {'w': w, 'docH': o['docH'], 'overflow_ok': ok, 'console': bad[:3], 'over': o['overflow'][:3]}
            print(('OK  ' if ok and not bad else 'BAD ') + f'{f:32s} w={w:5d} h={o["docH"]:5d}' + ('' if ok else f' overflow={o["overflow"][:2]}') + ('' if not bad else f' console={bad[:2]}'))
            pg.context.close()
        b.close()
    old = {}
    try: old = json.load(open(f'{OUT}/heights.json'))
    except Exception: pass
    old.update(res)
    json.dump(old, open(f'{OUT}/heights.json', 'w'), indent=1)
