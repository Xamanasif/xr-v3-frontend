#!/usr/bin/env python3
"""Exercise the controls the main journeys do not click, so LINK-MAP.json can report each one honestly.
usage: rvlinks.py WIDTH"""
import sys, json, os, urllib.request, re
sys.path.insert(0, '/home/claude/tools')
from playwright.sync_api import sync_playwright
import harness as H

BASE = H.BASE + '/proj/'
PROJ = '/tmp/claude-0/-home-claude/f99a1275-7610-5182-8624-21a078c24de9/scratchpad/rvcanvas/project/'
RES = []
def check(n, c, d=''):
    RES.append((n, bool(c), d)); print(('PASS ' if c else 'FAIL ') + n + ((' — ' + str(d)) if d and not c else ''))

class P:
    def __init__(self, b, w, page='RV.dc.html'):
        self.w, self.logs = w, []
        self.pg = H.new_page(b, w, 900 if w > 375 else 812, self.logs)
        self.pg.goto(BASE + page); H.settle(self.pg, 700)
    @property
    def narrow(self): return self.w < 1024
    def t(self, sel):
        l = self.pg.locator(sel); return l.first.inner_text() if l.count() else ''
    def focus(self):
        return self.pg.evaluate("() => (document.activeElement && (document.activeElement.id || document.activeElement.tagName)) || ''")
    def click(self, sel, text=None):
        l = self.pg.locator(sel, has_text=text) if text else self.pg.locator(sel)
        l.first.click(); self.pg.wait_for_timeout(250)
    def nav(self, label):
        if self.narrow:
            self.click('#rv-menu-btn'); self.click('.rb-drawer a', label)
        else:
            self.click('aside.rb-rail a', label)
    def close(self):
        bad = [l for l in self.logs if 'error' in l.lower()]
        self.pg.context.close(); return bad

def run(b, w):
    p = P(b, w)
    # rail / drawer foot: Help & support
    p.nav('Help & support')
    check(f'[{w}] rail Help & support opens Help & support', p.t('#rv-h1-help') == 'Help & support')
    # Overview: Open the review queue
    p.nav('Overview'); p.click('main .rk-head-act a', 'Open the review queue')
    check(f'[{w}] Overview “Open the review queue” opens the queue, heading focused', p.t('#rv-h1-q') == 'Review queue' and p.focus() == 'rv-h1-q', p.focus())
    # Queue toolbar chip remove and toolbar Clear filters
    p.pg.select_option('#rv-q-type', 'upd'); p.pg.wait_for_timeout(150)
    p.click('.rk-chip button')
    check(f'[{w}] queue chip × removes the Type filter', p.t('.rk-count') == '4 items · oldest first', p.t('.rk-count'))
    p.pg.select_option('#rv-q-course', 'CHE ZG513'); p.pg.wait_for_timeout(150)
    p.click('.rk-toolbar button', 'Clear filters')
    check(f'[{w}] queue toolbar Clear filters resets', p.t('.rk-count') == '4 items · oldest first' and p.focus() == 'rv-q-search', (p.t('.rk-count'), p.focus()))
    # Detail: Go to decision anchor, breadcrumb back, outcome move down, outcome edit cancel
    p.click('a.rk-rowlink', 'Conduction Through a Composite Wall')
    href = p.pg.locator('a', has_text='Go to decision').first.get_attribute('href')
    check(f'[{w}] “Go to decision” is an anchor to the decision panel', href == '#rv-panel' and p.pg.locator('#rv-panel').count() == 1, href)
    goto = p.pg.locator('a', has_text='Go to decision').first
    if goto.is_visible():
        p.click('a', 'Go to decision')
        inview = p.pg.evaluate("() => { const r = document.getElementById('rv-panel').getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0 }")
        check(f'[{w}] “Go to decision” brings the panel into view', inview)
    else:
        inview = p.pg.evaluate("() => { const r = document.getElementById('rv-panel').getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0 }")
        check(f'[{w}] decision panel sits beside the content, so “Go to decision” is hidden', inview)
    p.click('#rv-lo-0-dn')
    check(f'[{w}] outcome Move down announces the new position', 'it is now outcome 2' in p.t('#rv-lo-msg'), p.t('#rv-lo-msg'))
    p.click('#rv-lo-1-ed'); p.click('.rv-lo-item.is-editing button', 'Cancel')
    check(f'[{w}] outcome Cancel leaves edit mode, focus on Edit', p.pg.locator('.rv-lo-item.is-editing').count() == 0 and p.focus() == 'rv-lo-1-ed', p.focus())
    prev = p.pg.locator('.rk-detail a', has_text='walkthrough').first
    check(f'[{w}] preview link opens in a new tab', prev.get_attribute('target') == '_blank' and 'rel' in (prev.evaluate("e => e.getAttributeNames().join(' ')")) and 'walkthrough' in (prev.get_attribute('href') or ''))
    p.click('.rk-crumbs a')
    check(f'[{w}] breadcrumb returns to the review queue, heading focused', p.t('#rv-h1-q') == 'Review queue' and p.focus() == 'rv-h1-q', p.focus())
    # Account menu → Help → Report a problem → Cancel; then send and use the sent page's Back to Overview
    p.click('#rv-acct-btn'); p.click('#rv-acct-menu a', 'Help')
    p.click('.rk-state a', 'Report a problem'); p.click('main a', 'Cancel')
    check(f'[{w}] report Cancel returns to Help & support', p.t('#rv-h1-help') == 'Help & support')
    p.click('.rk-state a', 'Report a problem'); p.click('button', 'Send report')
    p.click('#rv-hp-errs a')
    check(f'[{w}] report error-summary link focuses the text field', p.focus() == 'rv-hp-what', p.focus())
    p.pg.fill('#rv-hp-what', 'Checking the links.'); p.click('button', 'Send report')
    p.click('main a', 'Back to Overview')
    check(f'[{w}] sent page “Back to Overview” opens the Overview', p.t('#rv-h1-ov') == 'Overview')
    p.nav('Help & support')
    p.click('main a', 'Report a problem')
    check(f'[{w}] Help (with reports) “Report a problem” opens the form', p.pg.locator('#rv-hp-what').count() == 1)
    p.click('main a', 'Cancel'); p.click('.rb-rows a.rk-rowlink')
    p.click('main a', 'Report a problem')
    check(f'[{w}] report detail “Report a problem” opens the form', p.pg.locator('#rv-hp-what').count() == 1)
    p.click('main a', 'Cancel'); p.click('.rb-rows a.rk-rowlink'); p.click('main a', 'Help & support')
    check(f'[{w}] report detail “Help & support” returns to the list', p.t('#rv-h1-help') == 'Help & support')
    if p.narrow:
        p.click('#rv-menu-btn'); p.click('#rv-menu-close')
        check(f'[{w}] drawer Close button closes it, focus on Menu', p.pg.locator('.rb-drawer').count() == 0 and p.focus() == 'rv-menu-btn', p.focus())
    bad = p.close(); check(f'[{w}] links run console clean', not bad, bad)

    # list states: calm overview, empty queue, failed lists, empty Reviewed by me, no-match Reviewed by me
    p = P(b, w, 'RV01-calm.dc.html'); p.click('main a', 'Open Reviewed by me')
    check(f'[{w}] calm Overview “Open Reviewed by me” opens Reviewed by me', p.t('#rv-h1-rb') == 'Reviewed by me'); p.close()
    p = P(b, w, 'RV02-empty.dc.html'); p.click('main a', 'Open Reviewed by me')
    check(f'[{w}] empty queue “Open Reviewed by me” opens Reviewed by me', p.t('#rv-h1-rb') == 'Reviewed by me'); p.close()
    p = P(b, w, 'RV02-failed.dc.html'); p.click('main button', 'Try again')
    check(f'[{w}] failed queue “Try again” loads the list', p.t('.rk-count') == '4 items · oldest first', p.t('.rk-count')); p.close()
    p = P(b, w, 'RV05-empty.dc.html'); p.click('main a', 'Open the review queue')
    check(f'[{w}] empty Reviewed by me “Open the review queue” opens the queue', p.t('#rv-h1-q') == 'Review queue'); p.close()
    p = P(b, w, 'RV05.dc.html'); p.pg.fill('#rv-r-search', 'Heat exchanger'); p.pg.wait_for_timeout(150)
    p.click('.rk-state button', 'Clear filters')
    check(f'[{w}] Reviewed by me no-match “Clear filters” resets', p.t('.rk-count') == '8 decisions · newest first', p.t('.rk-count')); p.close()
    # Reviewed by me failed state (harness-only wrapper with list-preset="failed" around the same RV.dc.html copy)
    p = P(b, w, '../tmpcheck/RV05-failed.dc.html'); p.click('main button', 'Try again')
    check(f'[{w}] failed Reviewed by me “Try again” loads the list', p.t('.rk-count') == '8 decisions · newest first', p.t('.rk-count')); p.close()
    # RV-06: outcome-block back link and breadcrumb
    p = P(b, w, 'RV06.dc.html'); p.click('#rv-done a', 'Back to Reviewed by me')
    check(f'[{w}] RV-06 “Back to Reviewed by me” opens Reviewed by me, heading focused', p.t('#rv-h1-rb') == 'Reviewed by me' and p.focus() == 'rv-h1-rb', p.focus()); p.close()
    p = P(b, w, 'RV06.dc.html'); p.click('.rk-crumbs a')
    check(f'[{w}] RV-06 breadcrumb opens Reviewed by me', p.t('#rv-h1-rb') == 'Reviewed by me'); p.close()
    # refusal message actions
    p = P(b, w, 'RV-scope.dc.html'); p.click('main a', 'Back to the review queue')
    check(f'[{w}] refusal “Back to the review queue” opens the queue', p.t('#rv-h1-q') == 'Review queue'); p.close()
    p = P(b, w, 'RV-unavailable.dc.html'); p.click('main a', 'Help & support')
    check(f'[{w}] refusal “Help & support” opens Help & support', p.t('#rv-h1-help') == 'Help & support'); p.close()

def index_links():
    s = open(PROJ + 'Main.dc.html').read()
    hrefs = sorted(set(re.findall(r'href="([A-Za-z0-9-]+\.dc\.html)"', s)))
    missing = [h for h in hrefs if not os.path.exists(PROJ + h)]
    served = [h for h in hrefs if urllib.request.urlopen(BASE + h).status != 200]
    boards = json.load(open(PROJ + 'canvas.json'))['boards']
    unlinked = sorted(set(boards) - set(hrefs) - {'Main.dc.html'})
    check(f'[index] Main links {len(hrefs)} boards, all exist and are served', not missing and not served, (missing, served))
    check('[index] every canvas board except Main is linked from Main', not unlinked, unlinked)
    tpl = open(PROJ + 'RV.dc.html').read().split('<script type="text/x-dc"')[0]
    check('[source] no href="#" placeholders in the role component', 'href="#"' not in tpl and "href='#'" not in tpl)

if __name__ == '__main__':
    mode = sys.argv[1]
    if mode == 'index':
        index_links()
    else:
        with sync_playwright() as pw:
            b = pw.chromium.launch(); run(b, int(mode)); b.close()
    f = [x for x in RES if not x[1]]
    print(f'== links {mode}: {len(RES) - len(f)} passed, {len(f)} failed')
    json.dump([{'check': n, 'pass': ok, 'detail': str(d)[:300]} for n, ok, d in RES], open(f'/home/claude/shots/journeys/links-{mode}.json', 'w'), indent=1)
