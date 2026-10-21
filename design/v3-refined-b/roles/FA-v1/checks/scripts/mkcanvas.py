# Build the final Faculty canvas project: final/canvas/ (Main, foundation CSS, fa.css, every board wrapper, doc boards, canvas.json)
#   python3 mkcanvas.py docs      -> doc boards only (900 px placeholder heights), for measuring
#   python3 mkcanvas.py build     -> everything, with heights from shots/post/results.json and checks/doc-heights.json
import json, os, sys, html, shutil, hashlib, datetime, re
FIN = os.path.dirname(os.path.abspath(__file__))
SP = os.path.dirname(FIN)
sys.path.insert(0, FIN)
import boards
CAN = os.path.join(FIN, 'publish', 'project')
PROJ = os.path.join(FIN, 'project')
E = lambda s: html.escape(str(s), quote=True)
COV = json.load(open(os.path.join(FIN, 'coverage.json')))
STATUS = COV['status'].replace('DESIGN COMPLETE · ', '').upper()
BANNER = 'DESIGN COMPLETE · ' + STATUS
CSS = ['core.css', 'rb.css', 'rb-kit.css', 'fa.css']

DOC_STYLE = '''
body{margin:0;background:#F3F4F9}
a{color:var(--link,#3B49B8)}a:hover{color:#141B5E}
/* doc-board styles (fd- prefix): these boards only; not part of the role stylesheet */
.fd{display:flex;flex-direction:column;gap:28px;max-width:1280px}
.fd-head{display:flex;flex-direction:column;gap:10px}
.fd-status{display:inline-flex;align-self:flex-start;align-items:center;gap:8px;min-height:30px;padding:4px 14px;border-radius:999px;background:var(--gold-tint);border:1px solid var(--gold-line);color:var(--gold-ink);font:700 14px/20px var(--sans);letter-spacing:.02em}
.fd-lead{max-width:62em;font:400 17px/27px var(--sans);color:var(--ink-2)}
.fd-figs{display:flex;flex-wrap:wrap;gap:0;margin:0;padding:18px 22px;border:1px solid var(--rb-line);border-radius:18px;background:var(--paper)}
.fd-fig{display:flex;flex-direction:column;gap:2px;padding:0 28px;border-left:1px solid var(--rb-line)}
.fd-fig:first-child{padding-left:0;border-left:0}
.fd-fig dt{order:2;font:500 14px/20px var(--sans);color:var(--ink-3)}
.fd-fig dd{order:1;margin:0;font:700 30px/36px var(--sans);color:var(--navy);font-variant-numeric:tabular-nums}
.fd-sec{padding:24px 26px}
.fd-sec > h2{margin-bottom:6px}
.fd-sec > .rk-hint{margin-bottom:16px}
.fd-legend{display:flex;flex-wrap:wrap;gap:10px 28px;margin:0;padding:0;list-style:none;font:400 15px/22px var(--sans);color:var(--ink-2)}
.fd-legend li{display:flex;gap:10px;align-items:flex-start;max-width:36em}
.fd-reg{width:100%;border-collapse:collapse}
.fd-reg > thead th{padding:10px 14px;border-bottom:1px solid var(--rb-line);background:#F7F8FC;color:var(--ink-3);font:600 14px/20px var(--sans);text-align:left}
.fd-reg > tbody > tr > td{padding:16px 14px;vertical-align:top;border-bottom:1px solid var(--rb-line);color:var(--ink-2);font:400 15px/22px var(--sans)}
.fd-reg > tbody > tr:last-child > td{border-bottom:0}
.fd-id{display:block;font:700 16px/22px var(--sans);color:var(--navy)}
.fd-name{display:block;font:600 15px/21px var(--sans);color:var(--ink)}
.fd-meta{display:block;margin-top:4px;font:500 13.5px/19px var(--sans);color:var(--ink-3)}
.fd-what{max-width:40em}
.fd-subs{display:flex;flex-direction:column;gap:7px;margin:0;padding:0;list-style:none}
.fd-subs li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 12px;align-items:start}
.fd-subs .fd-sub{font:500 14.5px/21px var(--sans);color:var(--ink)}
.fd-subs .fd-b{grid-column:1 / -1;font:400 13.5px/19px var(--sans);color:var(--ink-3)}
.fd-subs .fd-b a{font-weight:600}
.fd-pill{display:inline-flex;align-items:center;min-height:24px;padding:2px 10px;border-radius:999px;font:700 13px/18px var(--sans);letter-spacing:.02em;white-space:nowrap}
.fd-pill--r{background:var(--rb-sel-tint);color:var(--indigo-2)}
.fd-pill--u{background:#F2F8F4;color:var(--ok);border:1px solid #D3E8DA}
.fd-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;align-items:start}
.fd-list{display:flex;flex-direction:column;gap:10px;margin:0;padding:0;list-style:none}
.fd-list li{position:relative;padding-left:18px;font:400 15.5px/24px var(--sans);color:var(--ink-2)}
.fd-list li::before{content:"";position:absolute;left:2px;top:10px;width:6px;height:6px;border-radius:50%;background:var(--indigo)}
.fd-list b{color:var(--ink);font-weight:650}
.fd-kv{display:grid;grid-template-columns:220px minmax(0,1fr);gap:10px 24px;margin:0}
.fd-kv dt{font:600 14.5px/22px var(--sans);color:var(--ink)}
.fd-kv dd{margin:0;font:400 15px/22px var(--sans);color:var(--ink-2)}
.fd-mono{font:500 13.5px/20px ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--ink-2);word-break:break-all}
.fd-grid{width:100%;border-collapse:collapse}
.fd-grid th,.fd-grid td{padding:8px 10px;border-bottom:1px solid var(--rb-line);font:500 14px/20px var(--sans);color:var(--ink-2);text-align:left}
.fd-grid th{background:#F7F8FC;color:var(--ink-3);font-weight:600}
.fd-ok{color:var(--ok);font-weight:700}
.fd-bad{color:var(--err);font-weight:700}
'''

def doc(title, body, h, name):
    links = ''.join('<link rel="stylesheet" href="./%s">\n' % c for c in CSS)
    return ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
      '<title>' + E(title) + '</title>\n<script src="./support.js"></script>\n' + links + '</head>\n<body>\n<x-dc>\n<helmet>\n'
      '<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400..800&amp;display=swap" rel="stylesheet">\n<style>' + DOC_STYLE + '</style>\n</helmet>\n'
      '<div class="xr rb">\n  <div class="fa-pubpage">\n    <header class="fa-pubtop"><span class="fa-publogo">Official WILP logo</span><span class="fa-pubname">XR Learning Platform · Faculty · final complete-role design</span></header>\n'
      '    <main class="fa-pubbody">\n      <div class="fd">\n' + body + '\n      </div>\n    </main>\n  </div>\n</div>\n</x-dc>\n'
      "<script type=\"text/x-dc\" data-dc-script data-props='{\"$preview\":{\"width\":1440,\"height\":" + str(h) + "}}'>\n// Static " + name + " board for owner review; it imports nothing.\nclass Component extends DCLogic { renderVals() { return {}; } }\n</script>\n</body>\n</html>\n")

def pill(st):
    return '<span class="fd-pill %s">%s</span>' % ('fd-pill--r' if st == 'REDESIGNED' else 'fd-pill--u', E(st))

def blinks(bs):
    return ' · '.join('<a href="%s.dc.html">%s</a>' % (E(b), E(b)) for b in bs)

def coverage_board(h):
    T = COV['totals']
    figs = [('Owned IDs', T['ownedIds']), ('IDs redesigned', T['idsRedesigned']), ('Subviews registered', T['subviews']),
            ('Subviews redesigned', T['subviewsRedesigned']), ('Reviewed and unchanged', T['subviewsReviewedUnchanged']), ('Shared XS surfaces, unchanged', T['sharedSurfaces'])]
    out = ['<div class="fd-head"><span class="fd-status">' + E(BANNER) + '</span>',
           '<h1 class="rb-h1">Complete coverage register</h1>',
           '<p class="fd-lead">Every Faculty screen ID and its important subviews, with what was done to each. Board names link to the inspection boards on this canvas; every ID was also rendered at 1440, 1024, 768 and 375.</p></div>',
           '<dl class="fd-figs">' + ''.join('<div class="fd-fig"><dt>%s</dt><dd>%s</dd></div>' % (E(k), E(v)) for k, v in figs) + '</dl>',
           '<ul class="fd-legend"><li>%s<span>%s</span></li><li>%s<span>%s</span></li></ul>' % (pill('REDESIGNED'), E(COV['legend']['REDESIGNED']), pill('REVIEWED AND UNCHANGED'), E(COV['legend']['REVIEWED AND UNCHANGED']))]
    rows = []
    for x in COV['owned']:
        subs = ''.join('<li><span class="fd-sub">%s</span>%s<span class="fd-b">%s%s</span></li>' % (E(s['subview']), pill(s['status']), blinks(s['boards']), (' — ' + E(s['note'])) if s['note'] else '') for s in x['subviews'])
        rows.append('<tr><td><span class="fd-id">%s</span><span class="fd-name">%s</span><span class="fd-meta">%s · %s</span><span class="fd-meta">%s</span><div style="margin-top:8px">%s</div></td><td class="fd-what">%s</td><td><ul class="fd-subs">%s</ul></td></tr>' % (
            E(x['id']), E(x['name']), E(x['kind']), E(x['round']), E('Patterns ' + ', '.join(x['patterns'])), pill(x['status']), E(x['whatChanged']), subs))
    out.append('<section class="rk-surface" aria-labelledby="fd-own"><div class="fd-sec" style="padding-bottom:6px"><h2 class="rb-h2" id="fd-own">Owned screens · 21 IDs</h2><p class="rk-hint">FA-13, FA-23 and FA-24 are excluded in the pack and not designed.</p></div>'
               '<table class="fd-reg"><caption class="xr-sr">Owned screens and subviews</caption><thead><tr><th scope="col" style="width:220px">Screen</th><th scope="col" style="width:42%">What changed</th><th scope="col">Subviews and boards</th></tr></thead><tbody>' + ''.join(rows) + '</tbody></table></section>')
    srows = []
    for x in COV['shared']:
        subs = ''.join('<li><span class="fd-sub">%s</span>%s<span class="fd-b">%s — %s</span></li>' % (E(s['subview']), pill(s['status']), blinks(s['boards']), E(s['note'])) for s in x['subviews'])
        srows.append('<tr><td><span class="fd-id">%s</span><span class="fd-name">%s</span><span class="fd-meta">Borrowed XS contract</span></td><td><ul class="fd-subs">%s</ul></td></tr>' % (E(x['id']), E(x['name']), subs))
    out.append('<section class="rk-surface" aria-labelledby="fd-sh"><div class="fd-sec" style="padding-bottom:6px"><h2 class="rb-h2" id="fd-sh">Shared surfaces and refusals · reviewed and unchanged</h2><p class="rk-hint">Owned by the shared XS contract; Faculty borrows them. Their boards are pixel-identical to the published build, or only the redesigned page behind them differs.</p></div>'
               '<table class="fd-reg"><caption class="xr-sr">Shared surfaces</caption><thead><tr><th scope="col" style="width:260px">Surface</th><th scope="col">Subviews and boards</th></tr></thead><tbody>' + ''.join(srows) + '</tbody></table></section>')
    out.append('<section class="rk-surface fd-sec" aria-labelledby="fd-pat"><h2 class="rb-h2" id="fd-pat">Design patterns used across the role</h2><p class="rk-hint">Defined in the R1 checkpoint and applied to every owned screen in the final pass.</p><dl class="fd-kv">' +
               ''.join('<dt>%s</dt><dd>%s</dd>' % (E(k), E(v)) for k, v in COV['patterns'].items()) + '</dl></section>')
    return doc('Coverage register', '\n'.join(out), h, 'coverage register')

def changed_board(h):
    CH = json.load(open(os.path.join(FIN, 'journey-changes.json')))
    pats = [
     ('P1 Priority bands', 'FA-01 attention band; FA-18 queue toolbar (count, oldest wait, one gold Mark next).'),
     ('P2 Identity bands with figures', 'FA-03 course, FA-05 experiment and the FA-08…FA-12 assessment record. Person pages (FA-19, FA-21) keep the plain head with no aggregate figures.'),
     ('P3 Ledger', 'FA-02 course ledger.'),
     ('P4 Unit meters with counts in words', 'FA-01, FA-03, FA-04, FA-05, FA-06, FA-08, FA-12 and FA-20; one meter per format, never a percentage.'),
     ('P5 Reading sheet and action panel', 'FA-19 marking and FA-11 preview; FA-05 assessment panel.'),
     ('P6 Sectioned authoring with a side panel', 'FA-07 (4 steps), FA-10 settings, FA-15 editor, FA-16 drafting, FA-17 import.'),
     ('P7 Refined tables', 'FA-04, FA-06, FA-12, FA-14, FA-17, FA-18 and FA-20, plus the FA-22 export band; phone rows without repeated labels.'),
     ('P8 Sparse states', 'One compact message card for every no-course state (FA-01, 02, 04, 06, 07, 14, 16, 17, 18, 20); list empties keep the kit state.'),
     ('P9 Deadlines', 'Days left and the release rule on FA-01, FA-05, FA-06 and the record band.'),
     ('P10 Named, not numbered', 'Every owned screen: records are identified by name, by the student, by the question’s text or by its position — never by an internal technical id.'),
    ]
    out = ['<div class="fd-head"><span class="fd-status">' + E(BANNER) + '</span><h1 class="rb-h1">What changed</h1>',
           '<p class="fd-lead">One consistent Refined B design across all 21 Faculty IDs: the five R1 checkpoint screens carried over as they were, the R1 patterns applied to the other sixteen, the role styling consolidated into one stylesheet, and internal technical IDs taken out of ordinary user-facing labels. Per-screen detail is in the coverage register.</p></div>',
           '<section class="rk-surface fd-sec" aria-labelledby="fd-id"><h2 class="rb-h2" id="fd-id">Internal technical IDs leave ordinary labels</h2><p class="rk-hint">Owner decision, 21 October 2026, extending owner decision 6 (Super Admin) to Faculty. Presentation only.</p><ul class="fd-list">'
           '<li><b>Out of every visible label, placeholder, dialog title, notice and accessible name:</b> ASMT-, ATT-, Q- and D- identifiers. Records are named instead: the assessment or experiment by its name, the submission as “Attempt 1 of 2”, a question by its text, its type or its position.</li>'
           '<li><b>Kept:</b> academic course codes (ME ZG523) and institution-issued student IDs (GIT-2026-0418) — a roll number is not an internal technical id, and the CSV keeps its “student ID” column.</li>'
           '<li><b>Kept out of sight, not removed:</b> stable keys still drive routing, element ids, the preview’s record selector and the question search, so searching by an id still works.</li>'
           '<li><b>No business rule changed:</b> versions, attempts, one assessment per experiment, marking, release and import behave exactly as before — an imported batch still gets its ids, the finished notice simply no longer lists them.</li>'
           '<li><b>Checked:</b> all 219 boards swept for ASMT-, ATT-, Q- and D- in visible text, aria-label, title, placeholder, alt and screen-reader text — 0 found; and 204 interaction steps across the message, dialog and export flows carry the same guard.</li>'
           '<li><b>One left, on a borrowed surface:</b> Help &amp; support still answers a sent report with “Your reference is SUP-0231”. XS-07 belongs to the shared XS contract, so it is flagged rather than changed here.</li></ul></section>',
           '<div class="fd-cols"><section class="rk-surface fd-sec" aria-labelledby="fd-p"><h2 class="rb-h2" id="fd-p">Refinements, by pattern</h2><p class="rk-hint">Where each R1 pattern now applies.</p><dl class="fd-kv" style="grid-template-columns:200px minmax(0,1fr)">' +
           ''.join('<dt>%s</dt><dd>%s</dd>' % (E(a), E(b)) for a, b in pats) + '</dl></section>',
           '<section class="rk-surface fd-sec" aria-labelledby="fd-k"><h2 class="rb-h2" id="fd-k">What stays exactly as it was</h2><p class="rk-hint">The redesign changes presentation only.</p><ul class="fd-list">'
           '<li><b>Functions and routes:</b> every screen ID, tab, step, dialog and action is the one in the published build; in-role links are real anchors (no <code>#</code> placeholders).</li>'
           '<li><b>Permissions:</b> co-teachers see the same refusals; co-teachers are refused exactly as before and no answer key reaches a student view. Internal ids are hidden, never dropped: the same records, routes and keys are behind them.</li>'
           '<li><b>Rules and states:</b> three question types, CSV only, rules per assessment, versions on change after submissions, no re-marking, release policy unchanged.</li>'
           '<li><b>Sample facts:</b> the six sample worlds are unchanged; nothing was added to fill a layout.</li>'
           '<li><b>Foundation:</b> <code>core.css</code>, <code>rb.css</code> and <code>rb-kit.css</code> are byte-identical to the pack.</li>'
           '<li><b>Shared XS surfaces:</b> account menu, drawer, Help, Signed out, Not your workspace and the refusals are untouched.</li></ul></section></div>',
           '<section class="rk-surface fd-sec" aria-labelledby="fd-c"><h2 class="rb-h2" id="fd-c">Wording and layout changes a tester will notice</h2><p class="rk-hint">Same facts, shown differently. Journey checks were re-pointed for each, and the change is recorded in <code>checks/specs/journey-changes.json</code>.</p><ul class="fd-list">' +
           ''.join('<li>%s</li>' % E(x) for x in [
             'FA-05 Mark opens the oldest waiting submission (FA-19), as on FA-03; it used to open the marking queue (FA-18).',
             'FA-04 “Completed, by format” text lines became one unit meter per format with counts in words.',
             'FA-06 the deadline moved from a sub-line into its own Deadline column, with days left.',
             'FA-08 the submissions panel no longer repeats “2 of 5 students submitted”; it is a figure in the record band.',
             'FA-12 waiting rows show “— of 16” with “Marked automatically: 4 of 6”; release shows “Not yet” with the rule beneath.',
             'FA-14 a question’s sub-line is now a type tag, with “Version 2” when there is more than one version; drafts became review cards.',
             'FA-17 the row check shows four figures (Rows, Ready, With errors, With warnings) instead of pill counts.',
             'FA-21 the total reads “11 of 16 marks” with “Passed · pass mark 8”, as on FA-19.',
             'Field hints shortened: “A whole number from 0 to 100.”, “For example 14 Nov 2026, 23:59”.',
             'No-course states on FA-04, FA-06, FA-07 and FA-16 use the compact message card used elsewhere in the role.',
             'Internal ids leave the labels: the assessment band and FA-06 rows drop ASMT-0009; submissions and the marking queue read “Attempt 1 of 2”; the bank’s quiet line reads “Version 2”; search is by “Words in the question”; the delete dialog asks “Delete this question?”; an export is named after the assessment.']) + '</ul></section>',
           '<section class="rk-surface fd-sec" aria-labelledby="fd-s"><h2 class="rb-h2" id="fd-s">One role stylesheet</h2><p class="rk-hint">For integration without mixing old and new designs.</p><ul class="fd-list">'
           '<li>All Faculty styling is in <b>one file, <code>fa.css</code></b>, loaded after the three foundation files. Part 1 holds the published components still in use; part 2 the refined components.</li>'
           '<li>The checkpoint’s working prefix <code>fr-</code> was renamed to <code>fa-</code> (301 names; map in <code>rename-map.json</code>); 84 selectors that no screen uses any more were removed.</li>'
           '<li>Proof: all 219 boards and responsive renders are pixel-identical before and after the consolidation, and no rule used by any rendered state was lost.</li></ul></section>']
    return doc('What changed', '\n'.join(out), h, 'what-changed')

def checks_board(h, ev):
    out = ['<div class="fd-head"><span class="fd-status">' + E(BANNER) + '</span><h1 class="rb-h1">Checks and evidence</h1>',
           '<p class="fd-lead">What was rendered and exercised on this exact build, in a local Chromium (Playwright) with the Design runtime. The scripts, specifications and raw results are in the source package under <code>checks/</code>; screenshots are in the screenshot package.</p></div>']
    fig = [('Renders checked', ev['renders']), ('Journey steps passed', '%d of %d' % (ev['jok'], ev['jtot'])), ('Links crawled, all landing right', ev['links']),
           ('Boards scanned, structural issues', '%d · %d' % (ev['scanned'], ev['scanIssues'])), ('Pixel-identical after consolidation', '%d of %d' % (ev['pixSame'], ev['pixTot']))]
    out.append('<dl class="fd-figs">' + ''.join('<div class="fd-fig"><dt>%s</dt><dd>%s</dd></div>' % (E(k), E(v)) for k, v in fig) + '</dl>')
    # responsive matrix
    hdr = ''.join('<th scope="col">%s</th>' % w for w in boards.RESP_W)
    rows = ''.join('<tr><th scope="row">%s</th>%s</tr>' % (E(sid), ''.join('<td>%s</td>' % ev['resp'][sid][str(w)] for w in boards.RESP_W)) for sid in boards.PRIMARY)
    out.append('<section class="rk-surface fd-sec" aria-labelledby="fd-r"><h2 class="rb-h2" id="fd-r">Responsive · every owned ID at four widths</h2><p class="rk-hint">Each cell: page height in px, with no horizontal page scroll, no console error and no element running off the page (wide CSV previews scroll inside their own region). Screenshots: <code>responsive/</code>.</p>'
               '<table class="fd-grid"><caption class="xr-sr">Responsive results</caption><thead><tr><th scope="col">ID · state</th>' + hdr + '</tr></thead><tbody>' + rows + '</tbody></table></section>')
    jrows = ''.join('<tr><th scope="row">%s</th><td>%s</td><td>%s</td><td class="%s">%d of %d</td></tr>' % (E(s), E(d), E(w), 'fd-ok' if ok == tot else 'fd-bad', ok, tot) for s, d, w, ok, tot in ev['jsets'])
    out.append('<section class="rk-surface fd-sec" aria-labelledby="fd-j"><h2 class="rb-h2" id="fd-j">Interaction · connected journeys</h2><p class="rk-hint">Real clicks, typing and keys inside one live preview per journey; each step checks the visible text, focus or an assertion.</p>'
               '<table class="fd-grid"><caption class="xr-sr">Journeys</caption><thead><tr><th scope="col">Set</th><th scope="col">What it drives</th><th scope="col">Widths</th><th scope="col">Steps passed</th></tr></thead><tbody>' + jrows + '</tbody></table></section>')
    out.append('<section class="rk-surface fd-sec" aria-labelledby="fd-id2"><h2 class="rb-h2" id="fd-id2">Internal technical IDs</h2><ul class="fd-list">' + ''.join('<li>%s</li>' % x for x in ev['ids']) + '</ul></section>')
    out.append('<div class="fd-cols"><section class="rk-surface fd-sec" aria-labelledby="fd-a"><h2 class="rb-h2" id="fd-a">Accessibility and keyboard</h2><ul class="fd-list">' + ''.join('<li>%s</li>' % x for x in ev['a11y']) + '</ul></section>'
               '<section class="rk-surface fd-sec" aria-labelledby="fd-f"><h2 class="rb-h2" id="fd-f">Consistency and foundation</h2><ul class="fd-list">' + ''.join('<li>%s</li>' % x for x in ev['cons']) + '</ul></section></div>')
    out.append('<section class="rk-surface fd-sec" aria-labelledby="fd-n"><h2 class="rb-h2" id="fd-n">Not tested here</h2><ul class="fd-list">' + ''.join('<li>%s</li>' % E(x) for x in ev['nottested']) + '</ul></section>')
    return doc('Checks and evidence', '\n'.join(out), h, 'checks')

def evidence():
    res = {r['name']: r for r in json.load(open(os.path.join(FIN, 'shots', 'post', 'results.json')))}
    resp = {}
    for sid in boards.PRIMARY:
        resp[sid] = {}
        for w in boards.RESP_W:
            r = res['R-' + sid.replace('-', '') + '-' + str(w)]
            unc = [x for x in r['wide'] if not x.startswith('[clipped]')]
            ok = r['overflowX'] <= 0 and not r['errors'] and not unc
            resp[sid][str(w)] = ('<span class="fd-ok">✓</span> ' if ok else '<span class="fd-bad">✗</span> ') + str(r['height'])
    jsets, jok, jtot = [], 0, 0
    DESC = {'j-1440': ('create · bank · marking · students · co-teacher chains', '1440'), 'j-narrow': ('the same five chains', '1024 · 768 · 375'),
            'j5': ('drawer, account menu, delete dialog, 15 Nov release, no courses', '375 · 1440'), 'j6': ('draft with assistance, drafting fails', '1440'),
            'j6-375': ('draft with assistance, drafting fails', '375'), 'j7': ('settings and questions, list filters', '1440'),
            'j8': ('R1 screens: overview, courses, new teacher, marking total, drafting', '1440'), 'j8-narrow': ('R1 screens', '768 · 375'),
            'j10': ('the message, dialog and export chains again, with an internal-ID guard on every step', '1440'),
            'j9': ('final pass: experiment chain, record tabs, bank cards, queue and students, import figures, phone and tablet sweeps, keyboard focus', '1440 · 768 · 375')}
    for s in ['j-1440', 'j-narrow', 'j5', 'j6', 'j6-375', 'j7', 'j8', 'j8-narrow', 'j9', 'j10']:
        p = os.path.join(FIN, 'checks', 'journeys', 'out', s, 'journeys.json')
        if not os.path.exists(p): continue
        rep = json.load(open(p)); ok = sum(1 for j in rep for st in j['steps'] if st['ok']); tot = sum(len(j['steps']) for j in rep)
        NAMES = {'j-1440': 'J1–J4', 'j-narrow': 'J1–J4 narrow', 'j5': 'J5', 'j6': 'J6', 'j6-375': 'J6 phone', 'j7': 'J7', 'j8': 'J8', 'j8-narrow': 'J8 narrow', 'j9': 'J9', 'j10': 'J10'}
        jsets.append((NAMES[s], DESC[s][0], DESC[s][1], ok, tot)); jok += ok; jtot += tot
    links = json.load(open(os.path.join(FIN, 'checks', 'links.json')))
    scan = json.load(open(os.path.join(FIN, 'checks', 'scan.json')))
    pix = json.load(open(os.path.join(FIN, 'checks-pixcmp.json')))
    r1 = json.load(open(os.path.join(FIN, 'checks', 'r1-vs-final.json')))
    sha = lambda f: hashlib.sha256(open(os.path.join(PROJ, f), 'rb').read()).hexdigest()
    a11y = ['<b>%d boards</b> scanned for unnamed controls, unlabelled fields, duplicate IDs, broken ARIA references, placeholder links, one h1 per view and stray copy: <b>%d issues</b>.' % (len(scan), sum(len(x['issues']) for x in scan)),
            'Keyboard focus ring on every stop tabbed through FA-08, FA-10, FA-12, FA-14 drafts and FA-20 (38 stops), on the control or its row.',
            'Drawer and account menu trap and return focus; Escape closes; the delete and confirm-marks dialogs return focus; the bank panel’s close returns focus to its button.',
            'Text below 13 px: only the kit’s WEB / AR / VR / MR format chips (12 px, foundation component).',
            'Long text stress test (names and titles 3–5× longer) at 1440 and 375 on 23 screens: no horizontal scroll, no clipped text.']
    cons = ['Foundation hashes unchanged: core.css <span class="fd-mono">%s…</span>, rb.css <span class="fd-mono">%s…</span>, rb-kit.css <span class="fd-mono">%s…</span>.' % (sha('core.css')[:12], sha('rb.css')[:12], sha('rb-kit.css')[:12]),
            'Role stylesheet <code>fa.css</code> <span class="fd-mono">%s…</span>: one file, additive, existing tokens only.' % sha('fa.css')[:12],
            'Consolidation: <b>%d of %d</b> renders pixel-identical before and after; no rule used by a rendered state was lost.' % (pix_same(pix), pix_tot(pix)),
            'R1 carry-over: <b>%d of %d</b> R1-screen boards pixel-identical to the R1 checkpoint you saw. FA-02 and FA-03 are untouched; the rest differ only by the two later owner decisions — sparse-state consistency (FA-01 and FA-16 no-course cards) and internal ids leaving the labels (FA-16 and FA-19).' % (sum(1 for v in r1.values() if v == 'IDENTICAL'), len(r1)),
            '%d boards pixel-identical to the published build where the register says unchanged; dialogs, refusals and empty states compared element by element.' % sum(1 for v in json.load(open(os.path.join(FIN, 'checks', 'pub-vs-final.json'))).values() if v['same'])]
    nottested = ['A real backend, real files on disk (exports show the rows; the import template is a data: CSV link) and real drafting assistance — all are labelled sample stand-ins.',
                 'Screen readers beyond the structural scan (names, labels, roles, live regions were checked in markup; no NVDA / VoiceOver session).',
                 'Browsers other than Chromium, and zoom above 100 %.', 'Cross-role effects (a student seeing a released result) — documented, not linked.']
    idscan = json.load(open(os.path.join(FIN, 'checks', 'idscan.json')))
    g = [j for j in json.load(open(os.path.join(FIN, 'checks', 'journeys', 'out', 'j10', 'journeys.json')))] if os.path.exists(os.path.join(FIN, 'checks', 'journeys', 'out', 'j10', 'journeys.json')) else []
    ids = ['<b>%d boards</b> swept for ASMT-, ATT-, Q- and D- identifiers in visible text, <code>aria-label</code>, <code>title</code>, <code>placeholder</code>, <code>alt</code> and screen-reader text: <b>%d found</b>.' % (len(idscan), sum(len(x['hits']) for x in idscan)),
           'J10 repeats the chains that produce messages, notices and dialogs with the same guard on every step: <b>%d of %d</b> steps pass.' % (sum(1 for j in g for st in j['steps'] if st['ok']), sum(len(j['steps']) for j in g)),
           'Kept on purpose: academic course codes, institution-issued student IDs and the CSV “student ID” column; stable keys in routing, element ids and the question search.',
           'One identifier remains in the role, on a borrowed surface: Help &amp; support answers a sent report with “Your reference is SUP-0231”. XS-07 is owned by the shared XS contract, so it is flagged for its owner rather than changed here.']
    return {'ids': ids, 'renders': len(res), 'jok': jok, 'jtot': jtot, 'jsets': jsets, 'links': '%d · %d not ok' % (len(links), sum(1 for x in links if not x['ok'])),
            'scanned': len(scan), 'scanIssues': sum(len(x['issues']) for x in scan), 'pixSame': pix_same(pix), 'pixTot': pix_tot(pix), 'resp': resp,
            'a11y': a11y, 'cons': cons, 'nottested': nottested}

def pix_same(p): return len(p['identical'])
def pix_tot(p): return len(p['identical']) + len(p['different']) + len(p['size']) + len(p['missing'])

def write_docs(H):
    ev = evidence() if all(os.path.exists(os.path.join(FIN, *p)) for p in [('checks', 'links.json'), ('checks', 'scan.json'), ('checks-pixcmp.json',)]) else None
    open(os.path.join(CAN, 'Coverage-Register.dc.html'), 'w').write(coverage_board(H.get('Coverage-Register', 900)))
    open(os.path.join(CAN, 'What-changed.dc.html'), 'w').write(changed_board(H.get('What-changed', 900)))
    if ev: open(os.path.join(CAN, 'Checks.dc.html'), 'w').write(checks_board(H.get('Checks', 900), ev))

def build(final):
    os.makedirs(CAN, exist_ok=True)
    for f in os.listdir(CAN):
        if f.endswith('.dc.html') or f.endswith('.css') or f == 'canvas.json': os.remove(os.path.join(CAN, f))
    for f in ['Main.dc.html'] + CSS: shutil.copyfile(os.path.join(PROJ, f), os.path.join(CAN, f))
    res = {r['name']: r['height'] for r in json.load(open(os.path.join(FIN, 'shots', 'post', 'results.json')))}
    dh = json.load(open(os.path.join(FIN, 'checks', 'doc-heights.json'))) if os.path.exists(os.path.join(FIN, 'checks', 'doc-heights.json')) else {}
    write_docs(dh)
    if not final: return
    B, notes, order = {}, {}, []
    def add(f, x, y, w, h, t, inter=True):
        B[f + '.dc.html'] = {'x': x, 'y': y, 'w': w, 'h': h, 'title': t, 'expand': 'fill', 'is_interactive': inter}; order.append(f + '.dc.html')
    y = 300; ri = 0
    # left column · the review boards (coverage register first), beside the sticky note
    notes['t-docs'] = {'x': -2100, 'y': 40, 'text': 'Read me · coverage register, what changed, checks', 'kind': 'title1', 'maxW': 1440}
    dy = 300
    for f, t in [('Coverage-Register', 'Complete coverage register · 21 IDs, 111 subviews'), ('What-changed', 'What changed · refinements, wording, one stylesheet'), ('Checks', 'Checks and evidence · responsive, journeys, accessibility, foundation')]:
        h = dh.get(f, 900); add(f, -2100, dy, 1440, h, t); dy += h + 160
    # row 0 · the live role preview and the live starting points
    notes['t-r0'] = {'x': 0, 'y': y - 260, 'text': 'Start here · live role preview and live starting points (each keeps its own sample state)', 'kind': 'title1', 'maxW': 1}
    x = 0; mh = 0
    add('Main', x, y, 1440, 1100, 'Live role preview · 7 Nov 2026 · start here'); x += 1440 + 80; mh = 1100
    for f, t, w, sc, st, rec, pre in boards.LIVE[1:]:
        h = res.get(f, 1100) if w == 375 else 1100
        open(os.path.join(CAN, f + '.dc.html'), 'w').write(boards.wrap(t, boards.note_for(w, sc, st, rec, pre), w, h, sc, st, rec, pre, CSS))
        add(f, x, y, w, h, t); x += w + 80; mh = max(mh, h)
    notes['t-r0']['maxW'] = x - 80; y += mh + 380
    # rows per owned ID
    status = {o['id']: o for o in COV['owned']}
    for rid, name, bs in boards.ROWS:
        ri += 1
        if rid in status:
            o = status[rid]; title = '%s %s · %s · %s' % (rid, name, o['status'], 'R1 checkpoint' if o['round'].startswith('R1') else 'final pass')
        else:
            title = 'Shared surfaces (borrowed XS contract) and refusals · reviewed and unchanged'
        notes['t-r%d' % ri] = {'x': 0, 'y': y - 260, 'text': title, 'kind': 'title1', 'maxW': 1}
        x = 0; mh = 0
        for f, t, w, sc, st, rec, pre in bs:
            h = max(res.get(f, 900), 600)
            open(os.path.join(CAN, f + '.dc.html'), 'w').write(boards.wrap(t, boards.note_for(w, sc, st, rec, pre), w, h, sc, st, rec, pre, CSS))
            add(f, x, y, w, h, t); x += w + 80; mh = max(mh, h)
        notes['t-r%d' % ri]['maxW'] = x - 80; y += mh + 380
    notes['s-status'] = {'x': -560, 'y': 300, 'w': 480, 'fill': 'blue', 'size': 'm',
        'text': 'Faculty V3 · FINAL complete-role design\n\nAPPROVED BY THE OWNER, 21 October 2026.\n\nPress Play on “Live role preview” (right): every rail destination, tab, step, dialog and action works inside it. The live boards beside it start at 26 Oct, as a new teacher, as a co-teacher, and at 1024, 768 and 375 px.\n\nLeft: the coverage register (21 IDs, 111 subviews), what changed, and the checks.\n\nBelow: one row per owned ID — its states at 1440, then 375.\n\nInternal technical IDs are out of ordinary user-facing labels in this role; course codes and student IDs stay.'}
    first = ['Main.dc.html', 'Coverage-Register.dc.html', 'What-changed.dc.html', 'Checks.dc.html']
    order = first + [o for o in order if o not in first]
    c = {'v': 3, 'createdOnFiles': {'v': 1, 'at': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}, 'title': 'XR V3 · Faculty complete role · final design', 'launch': {'view': 'canvas'},
         'pages': [], 'boards': B, 'order': order, 'notes': notes, 'designSystems': []}
    json.dump(c, open(os.path.join(CAN, 'canvas.json'), 'w'), ensure_ascii=False, indent=1)
    print(len(B), 'boards ·', len([f for f in os.listdir(CAN) if f.endswith('.dc.html')]), 'board files ·', len(notes), 'notes')

if __name__ == '__main__':
    build(sys.argv[1] == 'build')
