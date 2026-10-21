#!/usr/bin/env python3
"""Smoke test after the ID change: the role still works end to end, and no internal ID appears in what the reviewer sees."""
import sys, re, json
sys.path.insert(0,'/home/claude/h')
from playwright.sync_api import sync_playwright
import harness as H
IDPAT=re.compile(r'\b(?:SUB|UPD|REQ|ACC)-\d{3,}\b')
R=[]
def ck(n,c,d=''):
    R.append((n,bool(c),d)); print(('PASS ' if c else 'FAIL ')+n+(('  — '+str(d)[:160]) if d and not c else ''))
def seen(pg):
    t=pg.evaluate("""() => { const out=[]; const walk=n=>{ if(n.nodeType===3){const p=n.parentElement; if(p&&getComputedStyle(p).display!=='none')out.push(n.textContent); return;} if(n.nodeType!==1)return; const cs=getComputedStyle(n); if(cs.display==='none')return; for(const a of ['aria-label','title','placeholder','alt','value']){const v=n.getAttribute&&n.getAttribute(a); if(v)out.push(v);} n.childNodes.forEach(walk); }; walk(document.body); return out.join(' | ')+' | '+document.title; }""")
    return sorted(set(IDPAT.findall(t)))
def run(b,w):
    logs=[]; pg=H.new_page(b,w,900 if w>375 else 812,logs)
    pg.goto(H.BASE+'/fin/RV.dc.html'); H.settle(pg,700)
    txt=lambda s: (pg.locator(s).first.inner_text() if pg.locator(s).count() else '')
    ck(f'[{w}] overview: no internal ID on screen', not seen(pg), seen(pg))
    pg.locator('a.rb-btn--primary').first.click(); pg.wait_for_timeout(400)
    ck(f'[{w}] review page opens on the oldest item', 'Flash Distillation' in txt('#rv-title'), txt('#rv-title'))
    ck(f'[{w}] breadcrumb names the experiment, not a record ID', 'Flash Distillation' in txt('.rk-crumbs'), txt('.rk-crumbs'))
    ck(f'[{w}] review page: no internal ID on screen', not seen(pg), seen(pg))
    pg.fill('#rv-lo-new','Explain flash separation using an energy balance.')
    pg.locator('button', has_text='Add outcome').first.click(); pg.wait_for_timeout(300)
    pg.locator('.rk-choice', has_text='Return to vendor').first.click(); pg.wait_for_timeout(200)
    pg.click('#rv-go'); pg.wait_for_timeout(400)
    ck(f'[{w}] return without a reason is refused', pg.locator('#rv-errs').count()==1, txt('#rv-errs'))
    pg.fill('#rv-reason','Please state which browsers the WEB build supports.')
    pg.click('#rv-go'); pg.wait_for_timeout(500)
    ck(f'[{w}] the return is recorded', 'Returned to vendor' in txt('#rv-done'), txt('#rv-done')[:80])
    ck(f'[{w}] recorded decision: no internal ID on screen', not seen(pg), seen(pg))
    pg.locator('#rv-done a', has_text='Back to the review queue').first.click(); pg.wait_for_timeout(500)
    ck(f'[{w}] queue drops to 3 items', txt('.rk-count').startswith('3 items'), txt('.rk-count'))
    ck(f'[{w}] queue: no internal ID on screen', not seen(pg), seen(pg))
    ck(f'[{w}] queue still shows course codes, vendors and formats', 'CHE ZG513' in txt('.rk-table') and pg.locator('.xr-fmt').count()>0 and (w < 1024 or 'Northline Simulation Studio' in txt('.rk-table')), 'narrow rows hide the sender line by design')
    # search still matches on the hidden record ID (logic preserved)
    pg.fill('#rv-q-search','SUB-0077'); pg.wait_for_timeout(300)
    ck(f'[{w}] search still finds an item by its hidden record ID', '1 of 3' in txt('.rk-count') and 'Conduction' in txt('.rk-table'), txt('.rk-count'))
    pg.fill('#rv-q-search',''); pg.wait_for_timeout(250)
    nav = (lambda lbl: (pg.click('#rv-menu-btn'), pg.get_by_role('link', name=lbl).last.click())) if w<1024 else (lambda lbl: pg.locator('aside.rb-rail a', has_text=lbl).first.click())
    nav('Reviewed by me'); pg.wait_for_timeout(500)
    ck(f'[{w}] Reviewed by me lists 9 decisions after the return', txt('.rk-count').startswith('9 decisions'), txt('.rk-count'))
    ck(f'[{w}] Reviewed by me: no internal ID on screen', not seen(pg), seen(pg))
    pg.locator('a.rk-rowlink').first.click(); pg.wait_for_timeout(500)
    ck(f'[{w}] a decided item opens read-only', pg.locator('#rv-panel .rk-choice').count()==0 and 'Returned to vendor' in txt('#rv-done'))
    ck(f'[{w}] decided item: no internal ID on screen', not seen(pg), seen(pg))
    bad=[l for l in logs if 'error' in l.lower()]
    ck(f'[{w}] console clean', not bad, bad)
    pg.context.close()
with sync_playwright() as p:
    b=p.chromium.launch()
    for w in (1440, 375): run(b,w)
    b.close()
f=[x for x in R if not x[1]]
print(f'== smoke: {len(R)-len(f)} passed, {len(f)} failed')
json.dump([{'check':n,'pass':ok,'detail':str(d)[:200]} for n,ok,d in R], open('/home/claude/shots/smoke.json','w'), indent=1)
