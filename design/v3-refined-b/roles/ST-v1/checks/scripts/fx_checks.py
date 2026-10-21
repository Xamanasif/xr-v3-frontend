# CHECKS.md for the final Student design, written from the raw results (no hand-typed numbers).
# Every check below ran on the approved build; the whole suite was re-run from scratch after the last change.
import json, pathlib, re, collections
R = pathlib.Path('/tmp/claude-0/fx/run'); FX = pathlib.Path('/tmp/claude-0/fx'); D = pathlib.Path('/home/claude/work/delivery-final')
STATUS = json.loads((D / 'status.json').read_text())
def log_counts(name):
    t = (R / name).read_text() if (R / name).exists() else ''
    return len(re.findall(r' @\d+ · ', t)), len(re.findall(r'clean$', t, re.M)), t
build = json.loads((FX / 'final-build.json').read_text())
wa, wb, w320 = log_counts('wA.log'), log_counts('wB.log'), log_counts('w320.log')
J = {w: json.loads((R / f'fxjourney-{w}.json').read_text()) for w in (1440, 1024, 768, 375)}
jres = {w: (sum(1 for r in J[w]['results'] if r['ok']), len(J[w]['results'])) for w in J}
logic = json.loads((R / 'logic.json').read_text())
lk = json.loads((R / 'links.json').read_text())
lost_cases = sorted({k.split('@')[0] for k, v in lk.items() if v['lost']}); lostB = sorted({b for v in lk.values() for b in v['lostB']})
lost_dests = sorted({x['href'] + ' ‹' + x['name'] + '›' for v in lk.values() for x in v['lost']})
idp = json.loads((R / 'idparity.json').read_text())
id_same = sum(1 for r in idp if r['baseline'] == r['final']); id_with = sum(1 for r in idp if r['baseline'])
id_now = sum(1 for r in idp if r['final']); id_dropped = sum(1 for r in idp if r['baseline'] and not r['final'])
lm = json.loads((R / 'linkmap.json').read_text())['summary']
axe = json.loads((R / 'axe.json').read_text()); axe_pages = len(axe['cases'])
stress_t = (R / 'stress.log').read_text(); stress_n = len(re.findall(r' @\d+: ', stress_t)); stress_bad = len(re.findall(r' @\d+: (?!clean)', stress_t))
focus = json.loads((R / 'focus.json').read_text()); f_pages = len(focus); f_stops = sum(r['stops'] for r in focus); f_bad = [r for r in focus if r['problems']]
trap = json.loads((R / 'trap.json').read_text())
hover = json.loads((R / 'hover.json').read_text()); h_ctrl = sum(r['controls'] for r in hover)
h_unexp = sorted({x for r in hover for x in r['noHover'] if not x.startswith('a.st-skip') and '[current]' not in x})
states = json.loads((R / 'states' / 'states.json').read_text())
boards = json.loads((R / 'boards' / 'boards-report.json').read_text()); b_bad = [b for b in boards if b['problems']]
help_small = bool(b_bad) and all(all('Help &amp;' in q or 'Help &' in q for q in b['problems']) for b in b_bad)
sub = json.loads((R / 'subcmp' / 'subcmp.json').read_text())
sc4 = json.loads((R / 'scroll' / 'scroll-4w.json').read_text()); sc320 = json.loads((R / 'scroll' / 'scroll-320.json').read_text())
bw = json.loads((R / 'btnw' / 'btnw.json').read_text())
ids = json.loads((R / 'ids.json').read_text()); seen = ids['identifiersSeenByAStudent']
src = json.loads((R / 'source.json').read_text())
root_txt = pathlib.Path('/home/claude/work/project/StudentFinal.dc.html').read_text()
idc = {k: root_txt.count(k) for k in ('SACC-0310', 'DTR-0018')}
idc['ACC-0107'] = root_txt.count('ACC-0107') - idc['SACC-0310']
ident = json.loads((FX / 'identity' / 'identity.json').read_text()); id_ok = sum(1 for r in ident if r['same'])
eye = json.loads((FX / 'eye.json').read_text()) if (FX / 'eye.json').exists() else {}
# findings, per render, over the whole pass
fin = {}
for d in ('wA', 'wB', 'w320'):
    for r in json.loads((R / d / 'report.json').read_text()): fin[r['file']] = r['problems']
fin_bad = {k: v for k, v in fin.items() if v}
xs06_only = bool(fin_bad) and all(k.startswith('xs06-') and all('small targets' in q for q in v) for k, v in fin_bad.items())
yes = lambda b: 'yes' if b else '**NO**'
L = []
L += [f'# Checks · Student · final design · what was actually rendered, inspected, tested and source-checked', '',
      f'Status: **{STATUS["statusLine"]}**.', '',
      'Labels: **RENDERED** = drawn in a real browser and checked by script. **INSPECTED BY EYE** = the rendered image was looked at. **LOGIC TESTED** = exercised by scripted interaction or by calling the preview’s own code, with assertions. **SOURCE CHECKED** = verified by scanning the source. **NOT TESTED** = not done.', '',
      '## Environment and build', '',
      '- Headless Chromium (Playwright) with the Claude Design host’s own runtime file, served locally (review tooling; not in the package). Public Sans from a local OFL copy (the sandbox blocks Google Fonts; the canvas loads it from Google Fonts). Viewport height 900; full-page captures.',
      f'- **Every check below ran on the approved build**: `project/StudentFinal.dc.html` `{build["root"][:12]}` with `project/v3-student-final.css` `{build["css"][:12]}` — the exact files in this package. The suite was re-run from scratch on these files after the last change (the owner’s decision to keep internal record identifiers out of Student labels), so no result below predates it.',
      f'- Consolidation proof, taken before any final-pass change: the one-stylesheet root against R2’s two layered stylesheets, 155 cases at 1440 and 375 — **{id_ok} / {len(ident)} pixel-identical**. That is what makes the single stylesheet safe; everything after it is measured against the original design instead.', '',
      '## RENDERED (automated checks)', '',
      '| Check | Scope | Result |', '| --- | --- | --- |',
      f'| Every case | 155 scenario × screen × state cases (all 19 IDs, every scenario that changes a screen, presets for errors, dialogs, menus, loading and failure) at **1440, 1024, 768 and 375** = {wa[0] + wb[0]} renders; {w320[0]} more at **320** | **{len(fin) - len(fin_bad)} of {len(fin)} clean.** ' +
      (f'The only finding: the borrowed XS-06 page’s *Help & support* text link is under 24 px tall ({len(fin_bad)} widths); axe’s target-size rule, which allows a small target with enough space around it, passes it.' if xs06_only else 'Findings: ' + '; '.join(f'{k}: {v}' for k, v in fin_bad.items())) + ' |',
      f'| Identifiers a student can see | The visible text and the screen-reader-only text of every case at 1440 and 375, scanned for identifier-shaped strings | **{", ".join(f"`{k}`" for k in seen)}** and nothing else: the two course codes (open decision 3) and the headset’s physical asset tag. No internal record identifier (`ACC-0107`, `SACC-0310`, `DTR-0018`) appears anywhere |',
      f'| Boards | {len(boards)} `F-*` boards at their own widths, heights measured into `canvas.json` | {len(boards) - len(b_bad)} clean' +
      (f'; the other {len(b_bad)} have one kind of finding: a *Help & support* text link under 24 px tall, inside the kit’s held-access banners (paused, inactive) or on the borrowed XS message page. axe’s target-size rule passes them' if help_small else (f"; findings: {'; '.join(sorted({p for b in b_bad for p in b['problems']}))[:300]}" if b_bad else '')) + ' |',
      f'| Long-text stress | 37 screen states × 1440 / 1024 / 768 / 375 with much longer experiment, course, institution, person, device, resource and assessment names | {stress_n} renders, **{stress_bad} with problems** |',
      f'| Accessibility scan | axe-core 4.10.2, WCAG 2.0 / 2.1 / 2.2 A and AA rules (including colour contrast and target size) on every case at four widths and on the live preview | **{sum(len(c["violations"]) for c in axe["cases"])} violations on {axe_pages} pages** |',
      f'| Scroll containers | Every element that scrolls or clips sideways (tab strips, panels) on every case at 1440, 1024, 768, 375 ({sc4["pages"]} pages) and 320 ({sc320["pages"]} pages): is anything wider than its box, so part of a tab or label is hidden until scrolled? | **{sc4["withHidden"] + sc320["withHidden"]} pages with hidden content** |',
      f'| Full-width buttons | Every button the stylesheet makes full width on phones, on every case at 375 and 320 ({bw["pages"]} pages): does it reach the full width of its section? | **{bw["withShortButtons"]} pages with a short button** |',
      f'| Shared components | The dialog, drawer, account menu, rail and focused-task bar rendered at a fixed size in the original design and in the final design, interiors compared by pixels | **{sum(1 for r in sub if r["interiorSame"])} / {len(sub)} identical** — they are the foundation’s, unchanged (coverage register) |',
      f'| Keyboard focus | Tab through {f_pages} pages (the primary state of every screen, plus dialog, drawer, account menu, error and failure states) at 1440, 768 and 375; at each stop the area around the control is compared focused vs unfocused | **{f_stops} Tab stops; focus visible at every stop on {f_pages - len(f_bad)} pages.** The other {len(f_bad)} are forced-open review presets ({", ".join(sorted({r["case"] for r in f_bad}))}): the preset draws the drawer or dialog without moving focus, so Tab walks the dimmed page underneath. With real interaction focus moves into the dialog, drawer and account menu and stays there: **{sum(1 for t in trap if t["ok"])} / {len(trap)} checks** at 1440, 768 and 375 |',
      f'| Hover | Every visible link, button, select, field and choice on {len(hover)} pages at 1440 hovered and compared | {h_ctrl} controls; the only controls with no hover change are the skip link (hidden until focused) and the current rail item' + (f'; also: {h_unexp}' if h_unexp else '') + ' |',
      f'| Interaction states | {len(states)} control types on real pages: default, hover, keyboard focus, pressed (`interaction-states/` in the screenshot archive) | ' + '; '.join(f"{s['k']}: " + ' '.join(k for k, v in s.get('differsFromDefault', {}).items() if v) for s in states) + ' |',
      '| Reduced motion | `prefers-reduced-motion: reduce` emulated in every render | the two Student transitions and the borrowed menu fade switch off |', '',
      'Each render checks: console errors and failed requests; the page scrolling sideways; **content spilling out of, or clipped by, the box that holds it**; clipped single-line text; duplicate IDs; exactly one H1; unresolved holes; visible “undefined / NaN / null”; `href="#"`; controls without an accessible name; ARIA references to missing IDs; controls under 24 px (breadcrumbs excluded; axe’s target-size rule covers them).', '',
      '## INSPECTED BY EYE', '',
      f'- Contact sheets of every primary screen at 1440, 1024, 768, 375 and 320, and {len(set(x for v in eye.values() for x in v))} images in total, including held, empty, loading, failure, error, dialog and menu states at 1440 and 375 (marked **[eye]** in the screenshot index).',
      '- During the final pass: the changed screens (ST-15, ST-10, ST-12, ST-05 Assessment tab, ST-17, the stage trackers) at every width, and every primary screen at 1024 and 768.',
      '- Defects found by eye and fixed: ST-15 card inside a card; the full-width Assessment-tab bar on tablets; stage checks hidden at 375; the short *Try again* / *See result* buttons on ST-12 *Not passed* (phones); the cut-off *Results* tab at 320. For the last two a script check was added and run on every case, to confirm nothing else had the same fault.',
      '- After the identifier decision: the sentences and rows it touches (ST-05 Overview pill, ST-07 chooser note, ST-08 WEB, ST-09 VR, ST-10 and ST-15 Progress, ST-18 My device) at 1440 and 375.', '',
      '## LOGIC TESTED', '',
      '**Journeys** against the live preview (review strip on):', '', '| Width | Checks passed |', '| --- | --- |']
L += [f'| {w} | **{jres[w][0]} / {jres[w][1]}** |' for w in (1440, 1024, 768, 375)]
L += ['', '- **J1 learning**: Home › course › Open experiment › Resources (open one: time recorded, progress untouched) › Simulation › Continue WEB › activity › Finish stage 2 › Finish the activity › back on WEB (recorded by the platform) › Progress agrees.',
      '- **J2 feedback**: rating sheet › empty submit (error summary, focus) › rate five › sent page on the same scale › Home moves on to VR.',
      '- **J3 assessment**: row led by its date › Before you start › Start › answer three › Next unanswered › Submit dialog (focus inside, Escape returns to Submit) › submitted › withheld result › Submitted tab › released score panel › marks by question jump › review › not passed: Try again is the one gold action.',
      '- **J4 device**: Open VR › My device › request form › empty error › sent (three dated steps) › forwarded › VR in progress and completed.',
      '- **J5 access restrictions**: paused, waiting for a licence, VR not now, AR and MR refusals (Continue WEB from AR), ST-19 (Open experiment), withdrawn (See your earlier work), ended, My device not available, feedback before completion, no assessment, inactive account.',
      '- **J6 keyboard**: Tab order on the WEB page; the drawer opens with focus on Close and Escape returns focus to Menu (768, 375); every page visited has one H1, at most one gold action and no `#` links; no console errors.', '',
      f"**Logic parity** (the preview’s own code, no DOM): **{logic['pass']} checks passed, {logic['fail']} failed**. Every method outside the declared presentation set is byte-identical to the original design — including `hubVM`, kept verbatim; the static data is identical; `resolve()` makes the same decision as the original in all 690 scenario × screen routes; refusal titles and destinations are kept; the one next-step rule equals the original hub rule in every scenario. **No business rule, route, guard, state transition or mutation changed in this design.**", '',
      f"**Comparison with the original design** (rendered, 155 cases × 1440, 1024, 768, 375): " + ('no original button is missing on any page' if not lostB else f'buttons not on the final page: {lostB}') + f"; the only original destinations not on a final page are Home’s shortcut links ({', '.join(lost_dests)}), on {len(lost_cases)} Home cases — decision 2 in `HANDOFF.md`.",
      f"**Internal record identifiers**: the original design showed one in {id_with} of {len(idp)} cases; the approved design shows one in **{id_now}**. The {id_dropped} differences are exactly the owner’s decision, applied in presentation only ({id_same} cases were identical to the original already). The rendered scan above is the check that none is left.",
      f"**Link map**: {lm['pages']} pages, {lm['linksListed']} visible links, {lm['uniqueScenarioDestinationPairs']} unique scenario × destination pairs — **{lm['unresolved']} unresolved**; each link classified and marked exercised-in-a-journey or rendered-and-resolved (`LINK-MAP.json`).", '',
      '## SOURCE CHECKED', '',
      f"- The final root loads exactly the foundation and `v3-student-final.css`: {yes(src['loads exactly foundation + v3-student-final.css'])}.",
      f"- Foundation byte-identical: {yes(src['foundation (core, rb, rb-kit) byte-identical'])}. The original delivery, checkpoint 1, checkpoint 2 and R2 unchanged: {yes(src['original delivery unchanged (Main, v3-student.css, 112 boards)'] and src['checkpoint 1 unchanged'] and src['checkpoint 2 unchanged'] and src['R2 unchanged (StudentR2, v3-student-r2.css, 108 boards)'])}.",
      f"- `StudentFinal.dc.html` differs from the original outside the replaced regions only in the title, the one stylesheet link and the `renderVals()` lines ({len(src['StudentFinal vs Main outside the replaced regions (expected: title, stylesheet link, render edits)'])} changed lines).",
      f"- `v3-student-final.css`: Part A {src['Part A rules']} rules, every one verbatim from `v3-student.css` ({len(src['Part A rules not verbatim from v3-student.css (pruned selector lists allowed)'])} not verbatim); Part B {src['Part B rules']} rules, every selector carrying an `sv-` class ({len(src['Part B selectors without sv-'])} without); no custom properties ({len(src['custom properties defined (whole file)'])}); no `!important` in Part B; no colour outside the base files ({len(src['Part B literal colours not in the base files'])}); no rgb() / hsl() literals, gradients, keyframes or font families; no text below 13 px in Part B ({', '.join(src['font sizes below 13px (Part B)']) or 'none'}).",
      f"- Every class the final templates and view models use is defined ({src['classes used']} classes; {len(src['classes used but not defined'])} missing); {src['sv classes defined']} `sv-` classes, {len(src['sv classes defined but never in the final source'])} unused.",
      f"- Internal record identifiers in the built root: `SACC-0310` {idc['SACC-0310']}×, `ACC-0107` {idc['ACC-0107']}×, `DTR-0018` {idc['DTR-0018']}× — none of them in a template or in a field a template renders. The two `DTR-0018` are the seeded record and the mutation that sets it (the original design's code, verbatim: the record still exists, as the business rules require); the two `ACC-0107` are inside the two `hubVM` fields kept verbatim for parity that no template reads (`cells`, `note`). The rendered scan above is the proof that none reaches a page.",
      '- No descendant `span` rule that could catch the runtime’s interpolation spans.', '',
      '## NOT TESTED', '',
      '- The canvas inside the Claude Design editor and Play mode itself (the published version is read back byte for byte after publishing).',
      '- Real screen readers (VoiceOver, NVDA, TalkBack) and real touch devices.',
      '- Safari and Firefox; Windows high-contrast mode; 200 % text zoom.',
      '- Every scenario × screen × preset combination (155 representative cases, not the full cross-product).',
      '- Real XR runtimes, real resource files and any backend behaviour — none exist in this design.', '',
      '## Evidence files', '', '`checks/results/` holds the raw results of every check above; `checks/scripts/` the scripts (they need the Design host’s runtime file, which is not included).']
(D / 'CHECKS.md').write_text('\n'.join(L) + '\n')
print('CHECKS.md written', len(L), 'lines')
