#!/usr/bin/env python3
"""Exercise the Academic Reviewer role preview in Chromium (local harness, real dc-runtime).
usage: rvtest.py WIDTH [journey ...]   — prints PASS/FAIL lines and writes screenshots."""
import sys, json, re, os
sys.path.insert(0, '/home/claude/tools')
from playwright.sync_api import sync_playwright
import harness as H

BASE = H.BASE + '/proj/'
OUT = '/home/claude/shots/journeys'
os.makedirs(OUT, exist_ok=True)
RESULTS = []

def check(name, cond, detail=''):
    RESULTS.append((name, bool(cond), detail))
    print(('PASS ' if cond else 'FAIL ') + name + (('  — ' + str(detail)) if detail and not cond else ''))

class R:
    def __init__(self, b, w, page='RV.dc.html', h=900):
        self.w = w
        self.logs = []
        self.pg = H.new_page(b, w, h, self.logs)
        self.pg.goto(BASE + page)
        H.settle(self.pg, 700)
    @property
    def narrow(self): return self.w < 1024
    def shot(self, name, full=True):
        self.pg.screenshot(path=f'{OUT}/{name}-{self.w}.png', full_page=full)
    def focused(self):
        return self.pg.evaluate("() => { const a = document.activeElement; return a ? (a.id || a.tagName) + '|' + (a.innerText || a.getAttribute('aria-label') || '').trim().slice(0, 60) : '' }")
    def text(self, sel):
        loc = self.pg.locator(sel)
        return loc.first.inner_text() if loc.count() else ''
    def nav(self, label):
        if self.narrow:
            self.pg.click('#rv-menu-btn'); self.pg.wait_for_timeout(150)
            self.pg.locator('.rb-drawer .rb-nav a', has_text=label).first.click()
        else:
            self.pg.locator('aside.rb-rail a', has_text=label).first.click()
        self.pg.wait_for_timeout(250)
    def overflow(self):
        o = H.overflow(self.pg)
        return o['scrollW'] <= o['clientW'] and not o['overflow'], o
    def console_ok(self):
        bad = [l for l in self.logs if 'error' in l.lower() or 'pageerror' in l]
        return not bad, bad

def j_overview(b, w):
    r = R(b, w)
    check(f'[{w}] overview H1', r.text('#rv-h1-ov') == 'Overview')
    check(f'[{w}] overview lists 4 waiting items oldest first', r.pg.locator('.rb-rows > li').count() == 4 and 'Flash Distillation' in r.text('.rb-rows > li:first-child'))
    check(f'[{w}] scope line shows three course codes', r.pg.locator('.rv-scope .rk-code').count() == 3)
    cnt = r.text('aside.rb-rail .rb-count') if not r.narrow else ''
    if not r.narrow: check(f'[{w}] rail count is 4', cnt.startswith('4'), cnt)
    check(f'[{w}] one gold primary: review the oldest', r.pg.locator('main .rb-btn--primary').count() == 1 and 'Flash Distillation' in r.text('main .rb-btn--primary'))
    ok, o = r.overflow(); check(f'[{w}] overview no horizontal overflow', ok, o)
    c, bad = r.console_ok(); check(f'[{w}] overview console clean', c, bad)
    r.shot('01-overview')

def j_return(b, w):
    """Queue -> submission -> inspect format/document -> return with missing-reason validation -> record -> queue/history update"""
    r = R(b, w)
    r.nav('Review queue')
    check(f'[{w}] queue H1 focused after nav', 'rv-h1-q' in r.focused(), r.focused())
    check(f'[{w}] queue count 4', r.text('.rk-count') == '4 items · oldest first', r.text('.rk-count'))
    ok, o = r.overflow(); check(f'[{w}] queue no horizontal overflow', ok, o)
    r.shot('02-queue')
    r.pg.locator('a.rk-rowlink', has_text='Flash Distillation').click(); r.pg.wait_for_timeout(300)
    check(f'[{w}] item title focused', 'rv-title' in r.focused(), r.focused())
    check(f'[{w}] eyebrow names SUB-0086 new submission', r.text('.rk-eyebrow') == 'SUB-0086 · New submission', r.text('.rk-eyebrow'))
    check(f'[{w}] documents listed', 'Flash drum handout.pdf' in r.text('.rv-docs'))
    link = r.pg.locator('.rv-dcard a.rv-ext').first
    check(f'[{w}] web link opens the vendor page in a new tab', link.get_attribute('target') == '_blank' and 'flash-distillation' in (link.get_attribute('href') or ''))
    check(f'[{w}] no-outcomes notice shown', 'No learning outcomes yet' in r.text('.rk-notice--info'))
    ok, o = r.overflow(); check(f'[{w}] submission page no horizontal overflow', ok, o)
    r.shot('03-submission-sub86')
    r.pg.locator('label[for="rv-c1"]').click(); r.pg.wait_for_timeout(150)
    check(f'[{w}] return shows the reason field and references', r.pg.locator('#rv-reason').count() == 1 and r.pg.locator('.rv-ref').count() >= 3)
    check(f'[{w}] pending hint before pressing', 'Add the reason' in r.text('.rk-pending'))
    check(f'[{w}] button reads Return to vendor', r.text('#rv-go') == 'Return to vendor')
    r.pg.click('#rv-go'); r.pg.wait_for_timeout(200)
    check(f'[{w}] error summary focused', 'rv-errs' in r.focused(), r.focused())
    check(f'[{w}] missing reason error text', 'Add a reason so the vendor knows what to change' in r.text('#rv-errs') and r.pg.locator('#rv-reason[aria-invalid="true"]').count() == 1)
    r.shot('04-return-errors')
    r.pg.locator('#rv-errs a').first.click(); r.pg.wait_for_timeout(150)
    check(f'[{w}] summary link focuses the reason field', 'rv-reason' in r.focused(), r.focused())
    r.pg.fill('#rv-reason', 'Please add a short preview so learners can see the flash drum before they start.')
    r.pg.locator('label.rv-ref', has_text='Preview link').count() == 0 and None
    r.pg.locator('label.rv-ref', has_text='Summary').click()
    r.pg.click('#rv-go'); r.pg.wait_for_timeout(300)
    check(f'[{w}] return recorded, outcome focused', 'rv-done' in r.focused(), r.focused())
    check(f'[{w}] outcome pill Returned to vendor', 'Returned to vendor' in r.text('#rv-done'))
    check(f'[{w}] outcome shows the reason and the reference', 'flash drum' in r.text('.rv-done-q') and 'Summary' in r.text('.rv-done-q'))
    check(f'[{w}] history shows the return first', 'Returned to vendor by Prof. A. Menon' in r.text('.rk-tl li:first-child'))
    check(f'[{w}] decision controls gone (read-only)', r.pg.locator('#rv-go').count() == 0)
    r.shot('05-returned-sub86')
    r.pg.locator('#rv-done a.rb-btn').click(); r.pg.wait_for_timeout(300)
    check(f'[{w}] back to queue focuses its heading', 'rv-h1-q' in r.focused(), r.focused())
    check(f'[{w}] queue now 3 items without Flash Distillation', r.text('.rk-count') == '3 items · oldest first' and 'Flash Distillation' not in r.text('.rk-table'), r.text('.rk-count'))
    if not r.narrow: check(f'[{w}] rail count now 3', r.text('aside.rb-rail .rb-count').startswith('3'))
    r.nav('Reviewed by me')
    first = r.text('.rv-rtable tbody tr:first-child')
    check(f'[{w}] Reviewed by me lists the return first', 'Flash Distillation' in first and 'Returned to vendor' in first, first)
    check(f'[{w}] Reviewed by me count 9', r.text('.rk-count') == '9 decisions · newest first', r.text('.rk-count'))
    r.shot('06-reviewed-after-return')
    r.nav('Overview')
    check(f'[{w}] overview now 3 waiting, oldest is Venturi', r.pg.locator('.rb-rows > li').count() == 3 and 'Venturi' in r.text('.rb-rows > li:first-child'))
    c, bad = r.console_ok(); check(f'[{w}] return journey console clean', c, bad)

def j_approve(b, w):
    """Submitted corrected scenario (SUB-0077 revision 2) -> approve with outcomes -> confirmation -> Reviewed by me"""
    r = R(b, w)
    r.pg.locator('.rb-rows > li', has_text='Conduction Through a Composite Wall').locator('a').click(); r.pg.wait_for_timeout(300)
    check(f'[{w}] SUB-0077 shows what changed in revision 2', 'What changed in revision 2' in r.text('#rv-s-chg') and r.pg.locator('.rv-cmp del', has_text='VR headset').count() == 1)
    check(f'[{w}] previous return reason quoted', 'Please clarify the VR device requirements.' in r.text('.rk-quote'))
    r.pg.locator('.rv-dcard', has_text='Virtual reality').locator('button').click(); r.pg.wait_for_timeout(150)
    check(f'[{w}] package details open with reference', 'NSS-CW-VR-1.0' in r.text('.rv-pkg') and r.pg.locator('.rv-dcard button[aria-expanded="true"]').count() == 1)
    check(f'[{w}] changed tag on device need', 'Changed in revision 2' in r.text('.rv-tag'), r.text('.rv-tag'))
    # edit outcome 3 then save
    r.pg.click('#rv-lo-2-ed'); r.pg.wait_for_timeout(150)
    check(f'[{w}] edit focuses the outcome text', 'rv-lo-ta-2' in r.focused(), r.focused())
    r.pg.fill('#rv-lo-ta-2', '')
    r.pg.locator('.rv-lo-item.is-editing button', has_text='Save outcome').click(); r.pg.wait_for_timeout(150)
    check(f'[{w}] empty outcome edit refused', 'Enter the outcome text, or cancel' in r.text('#rv-lo-ed-err'))
    r.pg.fill('#rv-lo-ta-2', 'Compare measured and predicted heat flux, and explain the difference.')
    r.pg.locator('.rv-lo-item.is-editing button', has_text='Save outcome').click(); r.pg.wait_for_timeout(150)
    check(f'[{w}] outcome saved message', 'Outcome 3 saved.' in r.text('#rv-lo-msg'))
    r.pg.click('#rv-lo-1-up'); r.pg.wait_for_timeout(150)
    check(f'[{w}] move up announces new position', 'it is now outcome 1' in r.text('#rv-lo-msg'))
    r.pg.locator('label[for="rv-c0"]').click()
    r.pg.click('#rv-go'); r.pg.wait_for_timeout(250)
    check(f'[{w}] confirm dialog opens with focus on its title', r.pg.locator('.rk-dialog').count() == 1 and 'rv-dlg-t' in r.focused(), r.focused())
    check(f'[{w}] dialog states approving does not publish', 'Approving does not publish' in r.text('.rk-dialog') and '3 learning outcomes' in r.text('.rk-dialog'))
    r.shot('07-confirm-sub77', full=False)
    r.pg.keyboard.press('Tab'); f1 = r.focused(); r.pg.keyboard.press('Tab'); f2 = r.focused(); r.pg.keyboard.press('Tab'); f3 = r.focused()
    check(f'[{w}] dialog Tab cycles Cancel → Approve → Cancel', 'rv-dlg-cancel' in f1 and 'rv-dlg-ok' in f2 and 'rv-dlg-cancel' in f3, (f1, f2, f3))
    r.pg.keyboard.press('Escape'); r.pg.wait_for_timeout(150)
    check(f'[{w}] Escape closes dialog and returns focus to the decision button', r.pg.locator('.rk-dialog').count() == 0 and 'rv-go' in r.focused(), r.focused())
    r.pg.click('#rv-go'); r.pg.wait_for_timeout(200)
    r.pg.click('#rv-dlg-ok'); r.pg.wait_for_timeout(300)
    check(f'[{w}] approval recorded, outcome focused', 'rv-done' in r.focused(), r.focused())
    check(f'[{w}] outcome says with the Content Manager, not published', 'Approved — with the Content Manager' in r.text('#rv-done') and 'Not published' in r.text('#rv-done'))
    check(f'[{w}] outcomes now read-only with the edit', r.pg.locator('.rv-lo-ro li').count() == 3 and 'heat flux, and explain' in r.text('.rv-lo-ro'))
    check(f'[{w}] head pill updated', 'Approved — with the Content Manager' in r.text('.rk-meta'))
    r.shot('08-approved-sub77')
    r.nav('Reviewed by me')
    first = r.text('.rv-rtable tbody tr:first-child')
    check(f'[{w}] Reviewed by me shows the approval first, now with the Content Manager', 'Conduction Through a Composite Wall' in first and 'Approved' in first and 'With the Content Manager' in first, first)
    rev1 = r.pg.locator('.rv-rtable tbody tr', has_text='Revision 1')
    check(f'[{w}] earlier revision-1 return kept in history', rev1.count() == 1 and 'Returned to vendor' in rev1.first.inner_text())
    r.pg.locator('.rv-rtable tbody tr:first-child a.rk-rowlink').click(); r.pg.wait_for_timeout(300)
    check(f'[{w}] reopening shows the decided item read-only (RV-06)', r.pg.locator('#rv-go').count() == 0 and 'Decided by you on 27 Aug 2026' in r.text('#rv-done'))
    check(f'[{w}] breadcrumb returns to Reviewed by me', r.text('.rk-crumbs a') == 'Reviewed by me')
    c, bad = r.console_ok(); check(f'[{w}] approve journey console clean', c, bad)

def j_blocked(b, w):
    r = R(b, w)
    r.pg.locator('main .rk-head-act .rb-btn--primary').click(); r.pg.wait_for_timeout(300)
    r.pg.locator('label[for="rv-c0"]').click(); r.pg.wait_for_timeout(100)
    check(f'[{w}] pending hint needs an outcome', 'Add at least one learning outcome' in r.text('.rk-pending'))
    r.pg.click('#rv-go'); r.pg.wait_for_timeout(200)
    check(f'[{w}] approve without outcomes refused in the summary', 'Add at least one learning outcome before you approve' in r.text('#rv-errs'))
    r.pg.click('#rv-lo-new'); r.pg.locator('.rv-lo-add button').click(); r.pg.wait_for_timeout(150)
    check(f'[{w}] empty new outcome refused', 'Enter the outcome text' in r.text('#rv-lo-new-err'))
    r.pg.fill('#rv-lo-new', 'Find the vapour fraction of a flashed binary feed from measured flows.')
    r.pg.locator('.rv-lo-add button').click(); r.pg.wait_for_timeout(200)
    check(f'[{w}] outcome added message', 'Outcome added — 1 outcome in the list.' in r.text('#rv-lo-msg'))
    check(f'[{w}] outcome error cleared after adding', r.pg.locator('#rv-errs').count() == 0)
    r.pg.click('#rv-go'); r.pg.wait_for_timeout(200)
    check(f'[{w}] dialog counts 1 learning outcome', 'with its 1 learning outcome.' in r.text('.rk-dialog'))
    r.pg.click('#rv-dlg-cancel'); r.pg.wait_for_timeout(150)
    check(f'[{w}] Cancel returns focus to the decision button', 'rv-go' in r.focused(), r.focused())

def j_recheck(b, w):
    r = R(b, w)
    r.pg.locator('.rb-rows > li', has_text='Venturi').locator('a').click(); r.pg.wait_for_timeout(300)
    check(f'[{w}] re-check reason is the first section', r.pg.locator('.rk-mainsheet > section').first.get_attribute('aria-labelledby') == 'rv-s-recheck' and 'Pitot tube' in r.text('#rv-s-recheck ~ blockquote, .rk-quote'))
    r.pg.locator('.rv-lo-item', has_text='Pitot').locator('button', has_text='Delete').click(); r.pg.wait_for_timeout(150)
    check(f'[{w}] delete announces and offers Undo', 'Outcome 2 deleted.' in r.text('#rv-lo-msg') and r.pg.locator('#rv-lo-msg button', has_text='Undo').count() == 1)
    r.pg.locator('#rv-lo-msg button', has_text='Undo').click(); r.pg.wait_for_timeout(150)
    check(f'[{w}] Undo restores outcome 2', 'Outcome 2 restored.' in r.text('#rv-lo-msg') and r.pg.locator('.rv-lo-item').count() == 3)
    r.pg.locator('.rv-lo-item', has_text='Pitot').locator('button', has_text='Delete').click(); r.pg.wait_for_timeout(150)
    r.pg.locator('label[for="rv-c0"]').click(); r.pg.click('#rv-go'); r.pg.wait_for_timeout(200)
    check(f'[{w}] re-check approval goes back to the Content Manager with 2 outcomes', 'goes back to the Content Manager with its 2 learning outcomes' in r.text('.rk-dialog'))
    r.shot('09-recheck-confirm', full=False)
    r.pg.click('#rv-dlg-ok'); r.pg.wait_for_timeout(300)
    check(f'[{w}] re-check approved', 'Approved — with the Content Manager' in r.text('#rv-done'))

def j_update(b, w, mode='approve'):
    r = R(b, w)
    r.nav('Review queue')
    r.pg.select_option('#rv-q-type', 'upd'); r.pg.wait_for_timeout(150)
    check(f'[{w}] type filter Update → 1 of 4 with a chip', r.text('.rk-count') == '1 of 4 items · oldest first' and r.pg.locator('.rk-chip').count() == 1, r.text('.rk-count'))
    r.pg.locator('a.rk-rowlink', has_text='Distillation Column').click(); r.pg.wait_for_timeout(300)
    check(f'[{w}] update title and eyebrow', 'Distillation Column · 1.2 → 1.3' in r.text('#rv-title') and 'UPD-0005' in r.text('.rk-eyebrow'))
    check(f'[{w}] live vs proposed marks the reflux change', r.pg.locator('.rv-cmp del', has_text='Lowering').count() == 1 and r.pg.locator('.rv-cmp ins', has_text='Raising').count() == 1)
    check(f'[{w}] why from the Content Manager shown', 'Corrects the reflux statement' in r.text('#rv-s-why ~ blockquote, blockquote'))
    check(f'[{w}] no learning outcome editor on an update', r.pg.locator('#rv-lo-new').count() == 0)
    ok, o = r.overflow(); check(f'[{w}] update page no horizontal overflow', ok, o)
    r.shot('10-update')
    if mode == 'approve':
        r.pg.locator('label[for="rv-c0"]').click(); r.pg.click('#rv-go'); r.pg.wait_for_timeout(200)
        check(f'[{w}] update dialog: live 1.2 stays until release', 'Version 1.2 stays live until then' in r.text('.rk-dialog') and 'Releasing changes no one’s access' in r.text('.rk-dialog'))
        r.shot('11-update-confirm', full=False)
        r.pg.click('#rv-dlg-ok'); r.pg.wait_for_timeout(300)
        check(f'[{w}] update approved: with the Super Admin, 1.2 unchanged', 'Approved — with the Super Admin' in r.text('#rv-done') and '1.2, unchanged' in r.text('#rv-done'))
        check(f'[{w}] the word Publish never appears on the update path', 'Publish' not in r.pg.inner_text('main'))
        r.shot('12-update-approved')
        r.nav('Reviewed by me')
        first = r.text('.rv-rtable tbody tr:first-child')
        check(f'[{w}] Reviewed by me: update approved, with the Super Admin', 'Distillation Column' in first and 'Update approved' in first and 'Super Admin' in first, first)
    else:
        r.pg.locator('label[for="rv-c1"]').click(); r.pg.click('#rv-go'); r.pg.wait_for_timeout(200)
        check(f'[{w}] update return needs a reason', 'Add a reason so the Content Manager knows what to change' in r.text('#rv-errs'))
        check(f'[{w}] no field references on update returns', r.pg.locator('.rv-ref').count() == 0)
        r.pg.fill('#rv-reason', 'The corrected sentence is right. Please also say that the purity gain levels off at high reflux, as the build 1.3 notes do.')
        r.pg.click('#rv-go'); r.pg.wait_for_timeout(300)
        check(f'[{w}] update returned to the Content Manager', 'Returned to the Content Manager' in r.text('#rv-done') and 'change it and send it again' in r.text('#rv-done'))
        r.shot('13-update-returned')
    c, bad = r.console_ok(); check(f'[{w}] update journey console clean', c, bad)

def j_filters(b, w):
    r = R(b, w)
    r.nav('Review queue')
    r.pg.fill('#rv-q-search', 'dist'); r.pg.wait_for_timeout(150)
    check(f'[{w}] search "dist" → 2 of 4', r.text('.rk-count') == '2 of 4 items · oldest first', r.text('.rk-count'))
    r.pg.select_option('#rv-q-course', 'ME ZG523'); r.pg.wait_for_timeout(150)
    check(f'[{w}] no match state with Clear filters', 'No items match these filters' in r.text('.rk-state'))
    r.shot('14-queue-nomatch')
    r.pg.locator('.rk-state button', has_text='Clear filters').click(); r.pg.wait_for_timeout(200)
    check(f'[{w}] Clear filters resets and focuses search', r.text('.rk-count') == '4 items · oldest first' and 'rv-q-search' in r.focused(), (r.text('.rk-count'), r.focused()))
    r.nav('Reviewed by me')
    check(f'[{w}] reviewed shows 8 decisions in scope (UPD-0006 out of scope)', r.text('.rk-count') == '8 decisions · newest first' and 'Induction Motor' not in r.text('.rk-table'), r.text('.rk-count'))
    r.pg.select_option('#rv-r-show', 'upd'); r.pg.wait_for_timeout(150)
    check(f'[{w}] Show updates → 2 of 8', r.text('.rk-count') == '2 of 8 decisions · newest first', r.text('.rk-count'))
    held = r.pg.locator('.rv-rtable tbody tr', has_text='Boiler Drum Level').inner_text()
    check(f'[{w}] held update shows only “with the Super Admin” (no hold, no reason)', 'Super Admin' in held and 'hold' not in held.lower(), held)
    r.shot('15-reviewed-updates')
    r.pg.locator('.rk-chip button').click(); r.pg.wait_for_timeout(150)
    r.pg.locator('a.rk-rowlink', has_text='Transient Cooling').click(); r.pg.wait_for_timeout(300)
    check(f'[{w}] RV-06 read-only: no decision controls, outcomes read-only', r.pg.locator('#rv-go').count() == 0 and r.pg.locator('.rv-lo-ro li').count() == 2 and r.pg.locator('#rv-lo-new').count() == 0)
    check(f'[{w}] RV-06 states the past decision', 'Decided by you on 14 Aug 2026, 15:10' in r.text('#rv-done'))
    ok, o = r.overflow(); check(f'[{w}] RV-06 no horizontal overflow', ok, o)
    r.shot('16-decided-sub74')
    c, bad = r.console_ok(); check(f'[{w}] filters journey console clean', c, bad)

def j_shell(b, w):
    r = R(b, w)
    if r.narrow:
        r.pg.click('#rv-menu-btn'); r.pg.wait_for_timeout(200)
        check(f'[{w}] drawer opens with focus on Close', 'rv-menu-close' in r.focused(), r.focused())
        r.shot('17-drawer', full=False)
        for _ in range(8): r.pg.keyboard.press('Tab')
        inside = r.pg.evaluate("() => !!document.activeElement.closest('.rb-drawer')")
        check(f'[{w}] Tab stays inside the drawer', inside)
        r.pg.keyboard.press('Escape'); r.pg.wait_for_timeout(150)
        check(f'[{w}] Escape closes the drawer and returns focus to Menu', r.pg.locator('.rb-drawer').count() == 0 and 'rv-menu-btn' in r.focused(), r.focused())
    r.pg.click('#rv-acct-btn'); r.pg.wait_for_timeout(150)
    check(f'[{w}] account menu opens (name, role, Help, Sign out)', r.pg.locator('#rv-acct-menu').count() == 1 and 'Help & support' in r.text('#rv-acct-menu') and 'Sign out' in r.text('#rv-acct-menu'))
    ok, o = r.overflow(); check(f'[{w}] account menu fits the viewport', ok, o)
    r.shot('18-account-menu', full=False)
    r.pg.keyboard.press('Escape'); r.pg.wait_for_timeout(150)
    check(f'[{w}] Escape closes the account menu, focus back on the button', r.pg.locator('#rv-acct-menu').count() == 0 and 'rv-acct-btn' in r.focused(), r.focused())
    r.pg.click('#rv-acct-btn'); r.pg.locator('#rv-acct-menu a', has_text='Help').click(); r.pg.wait_for_timeout(300)
    check(f'[{w}] account menu Help opens Help & support', r.text('#rv-h1-help') == 'Help & support')
    check(f'[{w}] empty reports state carries the primary action', 'No reports yet' in r.text('.rk-state') and r.pg.locator('.rk-state .rb-btn--primary').count() == 1)
    r.shot('19-help')
    r.pg.locator('.rk-state a', has_text='Report a problem').click(); r.pg.wait_for_timeout(250)
    check(f'[{w}] where is pre-filled from the page you came from', r.pg.input_value('#rv-hp-where') == 'Overview', r.pg.input_value('#rv-hp-where'))
    r.pg.locator('button', has_text='Send report').click(); r.pg.wait_for_timeout(200)
    check(f'[{w}] report without text refused with summary', 'Say what happened' in r.text('#rv-hp-errs') and 'rv-hp-errs' in r.focused())
    r.shot('20-report-errors')
    r.pg.fill('#rv-hp-what', 'The review queue count did not change after I approved an item.')
    r.pg.locator('button', has_text='Send report').click(); r.pg.wait_for_timeout(300)
    check(f'[{w}] report sent with a reference', 'Your reference is SUP-0214' in r.pg.inner_text('main'))
    r.shot('21-report-sent')
    r.pg.locator('a', has_text='View my reports').click(); r.pg.wait_for_timeout(250)
    check(f'[{w}] my reports lists the new report', 'SUP-0214' in r.text('.rb-rows'))
    r.pg.locator('.rb-rows a.rk-rowlink').click(); r.pg.wait_for_timeout(250)
    check(f'[{w}] report detail opens', 'SUP-0214' in r.text('.rk-eyebrow') and 'What you reported' in r.pg.inner_text('main'))
    r.pg.click('#rv-acct-btn'); r.pg.locator('#rv-acct-menu button', has_text='Sign out').click(); r.pg.wait_for_timeout(300)
    check(f'[{w}] sign out shows the signed-out page without the workspace', r.text('#rv-h1-out') == 'You’re signed out' and r.pg.locator('aside.rb-rail').count() == 0)
    r.shot('22-signed-out')
    r.pg.locator('button', has_text='Sign in').click(); r.pg.wait_for_timeout(300)
    check(f'[{w}] signing in returns to Overview', r.text('#rv-h1-ov') == 'Overview')
    c, bad = r.console_ok(); check(f'[{w}] shell journey console clean', c, bad)

def j_states(b, w):
    for page, name, checks in [
        ('RV-scope.dc.html', '23-refusal-scope', [('scope refusal title', lambda r: r.text('#rv-h1-msg') == 'This item isn’t in your review scope'), ('no rail item current', lambda r: r.pg.locator('aside.rb-rail a[aria-current="page"]').count() == 0 if not r.narrow else True), ('nothing of the record shown', lambda r: 'Induction' not in r.pg.inner_text('main'))]),
        ('RV-unavailable.dc.html', '24-refusal-unavailable', [('unavailable refusal title', lambda r: r.text('#rv-h1-msg') == 'This item isn’t available to you')]),
        ('RV-scope-withdrawn.dc.html', '25-scope-withdrawn', [('queue keeps only ME ZG523 work', lambda r: r.text('.rk-count') == '1 item · oldest first' and 'Conduction' in r.text('.rk-table')), ('course filter lists two codes', lambda r: r.pg.locator('#rv-q-course option').count() == 3)]),
        ('RV04-stale.dc.html', '26-stale', [('stale refusal shown', lambda r: 'Nothing was recorded' in r.text('#rv-refusal')), ('withdrawn status, no reason shown', lambda r: 'Withdrawn by the Content Manager' in r.text('.rk-meta') and 'reason' not in r.text('#rv-done').lower())]),
        ('RV02-loading.dc.html', '27-queue-loading', [('loading message, count hidden', lambda r: 'Loading the review queue' in r.text('.rk-loading-msg') and r.pg.locator('.rk-count').count() == 0)]),
        ('RV02-failed.dc.html', '28-queue-failed', [('failed state with Try again', lambda r: 'We couldn’t load the review queue' in r.text('.rk-state'))]),
        ('RV02-empty.dc.html', '29-queue-empty', [('empty queue, no toolbar, no rail count', lambda r: 'Nothing is waiting for your decision' in r.text('.rk-state') and r.pg.locator('.rk-toolbar').count() == 0)]),
        ('RV01-calm.dc.html', '30-overview-calm', [('calm overview', lambda r: 'Nothing is waiting for your decision' in r.text('.rb-calm'))]),
        ('RV05-empty.dc.html', '31-reviewed-empty', [('first-time reviewer empty state', lambda r: 'You haven’t decided anything yet' in r.text('.rk-state'))]),
        ('RV06-elsewhere.dc.html', '32-already-decided', [('already decided refusal', lambda r: 'Nothing new was recorded' in r.text('#rv-refusal') and r.pg.locator('#rv-go').count() == 0)]),
    ]:
        if not os.path.exists('/tmp/claude-0/-home-claude/f99a1275-7610-5182-8624-21a078c24de9/scratchpad/rvcanvas/project/' + page):
            check(f'[{w}] {page} exists', False, 'missing'); continue
        r = R(b, w, page)
        for label, fn in checks:
            try: check(f'[{w}] {label}', fn(r))
            except Exception as e: check(f'[{w}] {label}', False, e)
        ok, o = r.overflow(); check(f'[{w}] {page} no horizontal overflow', ok, o)
        c, bad = r.console_ok(); check(f'[{w}] {page} console clean', c, bad)
        r.shot(name)
        r.pg.context.close()

def j_stale_live(b, w):
    r = R(b, w, 'RV04-stale-armed.dc.html')
    r.pg.click('#rv-go'); r.pg.wait_for_timeout(200)
    r.pg.click('#rv-dlg-ok'); r.pg.wait_for_timeout(300)
    check(f'[{w}] stale: approve refused, refusal focused', 'rv-refusal' in r.focused() and 'Nothing was recorded' in r.text('#rv-refusal'), r.focused())
    tl = r.text('.rk-tl li:first-child')
    check(f'[{w}] stale: no approval recorded (history tops with the withdrawal)', 'Withdrawn by the Content Manager' in tl and 'Approved by' not in tl, tl)
    r.nav('Review queue')
    check(f'[{w}] stale: withdrawn update left the queue', 'Distillation Column' not in r.text('.rk-table') and r.text('.rk-count') == '3 items · oldest first', r.text('.rk-count'))
    r.nav('Reviewed by me')
    check(f'[{w}] stale: Reviewed by me unchanged at 8', r.text('.rk-count') == '8 decisions · newest first', r.text('.rk-count'))

JOURNEYS = {'overview': j_overview, 'return': j_return, 'approve': j_approve, 'blocked': j_blocked, 'recheck': j_recheck,
            'update': j_update, 'update-return': lambda b, w: j_update(b, w, 'return'), 'filters': j_filters, 'shell': j_shell,
            'states': j_states, 'stale-live': j_stale_live}

if __name__ == '__main__':
    w = int(sys.argv[1]); names = sys.argv[2:] or list(JOURNEYS)
    with sync_playwright() as p:
        b = p.chromium.launch()
        for n in names:
            try: JOURNEYS[n](b, w)
            except Exception as e: check(f'[{w}] journey {n} ran', False, repr(e)[:300])
        b.close()
    fails = [x for x in RESULTS if not x[1]]
    print(f'== width {w}: {len(RESULTS) - len(fails)} passed, {len(fails)} failed')
    json.dump([{'check': n, 'pass': ok, 'detail': str(d)[:300]} for n, ok, d in RESULTS], open(f'{OUT}/results-{w}.json', 'w'), indent=1)
