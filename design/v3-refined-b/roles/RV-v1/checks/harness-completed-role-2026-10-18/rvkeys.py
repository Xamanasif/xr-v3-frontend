#!/usr/bin/env python3
"""Keyboard-only journey + focus visibility + 320px reflow + long-text stress for the reviewer preview.
usage: rvkeys.py WIDTH"""
import sys, json, os
sys.path.insert(0, '/home/claude/tools')
from playwright.sync_api import sync_playwright
import harness as H

RES = []
def check(n, c, d=''):
    RES.append((n, bool(c), d)); print(('PASS ' if c else 'FAIL ') + n + ((' — ' + str(d)) if d and not c else ''))

def act(pg):
    return pg.evaluate("() => { const a = document.activeElement; if (!a) return {}; const cs = getComputedStyle(a); const tr = a.closest('tr'); const trs = tr ? getComputedStyle(tr) : null; return { id: a.id, tag: a.tagName, text: (a.innerText || a.getAttribute('aria-label') || a.value || '').trim().slice(0, 50), outline: cs.outlineStyle + ' ' + cs.outlineWidth, rowOutline: trs ? trs.outlineStyle : '', choice: a.closest('.rk-choice') ? getComputedStyle(a.closest('.rk-choice')).outlineStyle : '', ref: a.closest('.rv-ref') ? getComputedStyle(a.closest('.rv-ref')).outlineStyle : '' } }")

def tab_to(pg, pred, limit=80, back=False):
    for _ in range(limit):
        pg.keyboard.press('Shift+Tab' if back else 'Tab')
        a = act(pg)
        if pred(a): return a
    return None

def visible_focus(a):
    return ('solid' in a.get('outline', '') and not a.get('outline', '').endswith(' 0px')) or a.get('rowOutline') == 'solid' or a.get('choice') == 'solid' or a.get('ref') == 'solid'

def keyboard_journey(b, w):
    logs = []
    pg = H.new_page(b, w, 900, logs)
    pg.goto(H.BASE + '/proj/RV.dc.html'); H.settle(pg, 700)
    pg.locator('body').click(position={'x': 5, 'y': 5})
    a = tab_to(pg, lambda a: 'Review the oldest' in a.get('text', ''))
    check(f'[{w}] keyboard reaches “Review the oldest”', a is not None)
    if a: check(f'[{w}] it shows a visible focus ring', visible_focus(a), a)
    pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
    check(f'[{w}] Enter opens the review page, focus on its title', act(pg).get('id') == 'rv-title', act(pg))
    a = tab_to(pg, lambda a: a.get('id') == 'rv-lo-new')
    check(f'[{w}] keyboard reaches the outcome field', a is not None)
    pg.keyboard.type('Find the vapour fraction of a flashed feed from measured flows.')
    pg.keyboard.press('Tab'); pg.keyboard.press('Enter'); pg.wait_for_timeout(250)
    check(f'[{w}] Add outcome by keyboard', 'Outcome added' in pg.inner_text('#rv-lo-msg') if pg.locator('#rv-lo-msg').count() else False)
    a = tab_to(pg, lambda a: a.get('id') in ('rv-c0', 'rv-c1'))
    check(f'[{w}] keyboard reaches the decision radios', a is not None)
    if a: check(f'[{w}] the radio card shows focus', visible_focus(a), a)
    pg.keyboard.press('ArrowDown'); pg.wait_for_timeout(150)
    check(f'[{w}] arrow key selects Return to vendor', pg.locator('#rv-c1').is_checked())
    a = tab_to(pg, lambda a: a.get('id') == 'rv-go')
    check(f'[{w}] keyboard reaches the decision button', a is not None)
    pg.keyboard.press('Enter'); pg.wait_for_timeout(250)
    check(f'[{w}] missing reason error summary takes focus', act(pg).get('id') == 'rv-errs', act(pg))
    pg.keyboard.press('Tab'); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    check(f'[{w}] summary link moves focus into the reason field', act(pg).get('id') == 'rv-reason', act(pg))
    pg.keyboard.type('Please add a short preview of the simulation.')
    a = tab_to(pg, lambda a: a.get('tag') == 'INPUT' and (a.get('id') or '').startswith('rv-ref-'))
    check(f'[{w}] keyboard reaches a field reference', a is not None)
    if a:
        check(f'[{w}] the reference shows focus', visible_focus(a), a)
        pg.keyboard.press('Space'); pg.wait_for_timeout(100)
        check(f'[{w}] Space ticks the reference', pg.locator('.rv-ref input:checked').count() == 1)
    a = tab_to(pg, lambda a: a.get('id') == 'rv-go')
    pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
    check(f'[{w}] return recorded by keyboard, focus on the outcome', act(pg).get('id') == 'rv-done', act(pg))
    a = tab_to(pg, lambda a: 'Back to the review queue' in a.get('text', ''))
    check(f'[{w}] keyboard reaches “Back to the review queue”', a is not None)
    pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
    check(f'[{w}] queue heading focused after going back', act(pg).get('id') == 'rv-h1-q', act(pg))
    a = tab_to(pg, lambda a: a.get('tag') == 'A' and 'Venturi' in a.get('text', ''))
    check(f'[{w}] keyboard reaches a queue row link', a is not None)
    if a: check(f'[{w}] the focused row is outlined as a whole', a.get('rowOutline') == 'solid', a)
    bad = [l for l in logs if 'error' in l.lower()]
    check(f'[{w}] keyboard journey console clean', not bad, bad)
    pg.context.close()

def reflow_320(b):
    for page in ['RV.dc.html', 'RV02.dc.html', 'RV05.dc.html', 'RV03.dc.html', 'RV04.dc.html', 'RV06.dc.html', 'RV-help.dc.html', 'RV-scope.dc.html']:
        logs = []
        pg = H.new_page(b, 320, 640, logs)
        pg.goto(H.BASE + '/proj/' + page); H.settle(pg, 600)
        o = H.overflow(pg)
        check(f'[320] {page} reflows without sideways scroll (WCAG 1.4.10)', o['scrollW'] <= o['clientW'] and not o['overflow'], o['overflow'][:3])
        pg.screenshot(path=f'/home/claude/shots/journeys/reflow320-{page.replace(".dc.html", "")}.png', full_page=True)
        pg.context.close()

def stress(b):
    for w in (375, 768, 1440):
        for view in ['stress-overview', 'stress-queue', 'stress-item', 'stress-reviewed']:
            logs = []
            pg = H.new_page(b, w, 900, logs)
            pg.goto(H.BASE + f'/stress/{view}.dc.html'); H.settle(pg, 700)
            o = H.overflow(pg)
            check(f'[{w}] long text {view}: no sideways overflow', o['scrollW'] <= o['clientW'] and not o['overflow'], o['overflow'][:3])
            pg.screenshot(path=f'/home/claude/shots/journeys/{view}-{w}.png', full_page=True)
            pg.context.close()

if __name__ == '__main__':
    mode = sys.argv[1]
    with sync_playwright() as p:
        b = p.chromium.launch()
        if mode == 'reflow': reflow_320(b)
        elif mode == 'stress': stress(b)
        else: keyboard_journey(b, int(mode))
        b.close()
    f = [x for x in RES if not x[1]]
    print(f'== {mode}: {len(RES) - len(f)} passed, {len(f)} failed')
    json.dump([{'check': n, 'pass': ok, 'detail': str(d)[:300]} for n, ok, d in RES], open(f'/home/claude/shots/journeys/keys-{mode}.json', 'w'), indent=1)
