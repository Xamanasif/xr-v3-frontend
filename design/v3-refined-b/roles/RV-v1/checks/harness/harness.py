"""Shared Playwright helpers (harness only)."""
BASE = 'http://127.0.0.1:8765'
FONT_CSS = open('/home/claude/h/_fonts/public-sans.css').read()
OVERFLOW_JS = """() => {
  const de = document.documentElement, vw = de.clientWidth, out = [];
  const clipped = el => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) return true; } return false; };
  document.querySelectorAll('body *').forEach(el => { const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.visibility === 'hidden') return;
    if (r.right > vw + 1 && !clipped(el)) out.push(String(el.className).slice(0,50)); });
  return { scrollW: de.scrollWidth, clientW: vw, docH: de.scrollHeight, overflow: out.slice(0, 8) };
}"""
def new_page(browser, w, h=900, logs=None):
    ctx = browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1)
    pg = ctx.new_page()
    def fonts(route):
        url = route.request.url
        if 'fonts.googleapis.com' in url: route.fulfill(status=200, content_type='text/css', body=FONT_CSS)
        else: route.fulfill(status=204, body='')
    pg.route('https://fonts.googleapis.com/**', fonts)
    pg.route('https://fonts.gstatic.com/**', fonts)
    if logs is not None:
        pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') and 'never resolved' not in m.text else None)
        pg.on('pageerror', lambda e: logs.append(f'pageerror: {e}'))
    return pg
def settle(pg, ms=700):
    pg.wait_for_load_state('networkidle'); pg.evaluate("() => document.fonts && document.fonts.ready"); pg.wait_for_timeout(ms)
def overflow(pg): return pg.evaluate(OVERFLOW_JS)
