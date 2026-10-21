# Final Faculty canvas: the board list (one row per owned ID), plus helpers to write harness wrappers and render specs.
#   python3 boards.py harness <tw-dir-name> <project-dir>   -> harness/<tw>/T-<board>.dc.html for every component board
#   python3 boards.py spec <out.json> [resp]                 -> render spec (all boards; 'resp' adds the 1024/768 strip)
import json, os, sys, html
FIN = os.path.dirname(os.path.abspath(__file__))
SP = os.path.dirname(FIN)

# (file, title, width, scenario, start, rec, preset)  — preset may join several with '+'
LIVE = [
 ('Main', 'Live role preview · 7 Nov 2026 · start here', 1440, 'nov07', 'FA-01', '', ''),
 ('Live-Oct26', 'Live · 26 Oct 2026 · before the assessment exists', 1440, 'oct26', 'FA-01', '', ''),
 ('Live-New', 'Live · new teacher · no students yet', 1440, 'new', 'FA-01', '', ''),
 ('Live-Coteach', 'Live · co-teacher Dr Anita Desai', 1440, 'coteach', 'FA-01', '', ''),
 ('Live-Laptop', 'Live · laptop 1024 · 7 Nov 2026', 1024, 'nov07', 'FA-01', '', ''),
 ('Live-Tablet', 'Live · tablet 768 · 7 Nov 2026', 768, 'nov07', 'FA-01', '', ''),
 ('Live-Phone', 'Live · phone 375 · 7 Nov 2026', 375, 'nov07', 'FA-01', '', ''),
]
DOCS = [
 ('Index', 'Screen index · every owned ID and its boards'),
 ('Coverage-Register', 'Complete coverage register · 21 owned IDs and their subviews'),
 ('What-changed', 'What changed · consolidated refinements and content changes'),
 ('Checks', 'Checks · responsive, interaction, accessibility and foundation evidence'),
]

ROWS = [
 ('FA-01', 'Overview', [
   ('FA01-Overview', 'FA-01 Overview · populated', 1440, 'nov07', 'FA-01', '', ''),
   ('FA01-One-item', 'FA-01 · one item needs attention · 26 Oct', 1440, 'oct26', 'FA-01', '', ''),
   ('FA01-New-teacher', 'FA-01 · new teacher, no students yet', 1440, 'new', 'FA-01', '', ''),
   ('FA01-No-courses', 'FA-01 · no courses assigned', 1440, 'none', 'FA-01', '', ''),
   ('FA01-Coteach', 'FA-01 · co-teacher', 1440, 'coteach', 'FA-01', '', ''),
   ('FA01-Phone', 'FA-01 Overview · 375', 375, 'nov07', 'FA-01', '', ''),
   ('FA01-New-phone', 'FA-01 · new teacher · 375', 375, 'new', 'FA-01', '', ''),
 ]),
 ('FA-02', 'My courses', [
   ('FA02-My-courses', 'FA-02 My courses · populated', 1440, 'nov07', 'FA-02', '', ''),
   ('FA02-New', 'FA-02 · new teacher, no students yet', 1440, 'new', 'FA-02', '', ''),
   ('FA02-None', 'FA-02 · no courses assigned', 1440, 'none', 'FA-02', '', ''),
   ('FA02-Phone', 'FA-02 My courses · 375', 375, 'nov07', 'FA-02', '', ''),
 ]),
 ('FA-03', 'Course (teaching view)', [
   ('FA03-Course', 'FA-03 Course · populated', 1440, 'nov07', 'FA-03', 'MEZG523', ''),
   ('FA03-No-assessment', 'FA-03 · no assessment yet · 26 Oct', 1440, 'oct26', 'FA-03', 'MEZG523', ''),
   ('FA03-New', 'FA-03 · new teacher, no students yet', 1440, 'new', 'FA-03', 'MEZG523', ''),
   ('FA03-Coteach', 'FA-03 · co-teacher', 1440, 'coteach', 'FA-03', 'MEZG523', ''),
   ('FA03-Phone', 'FA-03 Course · 375', 375, 'nov07', 'FA-03', 'MEZG523', ''),
 ]),
 ('FA-04', 'Experiments (tab)', [
   ('FA04-Experiments', 'FA-04 Experiments · populated', 1440, 'nov07', 'FA-04', '', ''),
   ('FA04-No-match', 'FA-04 · no experiment matches', 1440, 'nov07', 'FA-04', '', 'nomatch'),
   ('FA04-Loading', 'FA-04 · loading', 1440, 'nov07', 'FA-04', '', 'loading'),
   ('FA04-Failed', 'FA-04 · couldn’t load', 1440, 'nov07', 'FA-04', '', 'failed'),
   ('FA04-No-courses', 'FA-04 · no courses assigned', 1440, 'none', 'FA-04', '', ''),
   ('FA04-New', 'FA-04 · no student activity yet', 1440, 'new', 'FA-04', '', ''),
   ('FA04-Phone', 'FA-04 Experiments · 375', 375, 'nov07', 'FA-04', '', ''),
 ]),
 ('FA-05', 'Experiment (teaching view)', [
   ('FA05-Experiment', 'FA-05 Experiment · populated', 1440, 'nov07', 'FA-05', '', ''),
   ('FA05-No-assessment', 'FA-05 · no assessment yet · 26 Oct', 1440, 'oct26', 'FA-05', '', ''),
   ('FA05-New', 'FA-05 · no students with access yet', 1440, 'new', 'FA-05', '', ''),
   ('FA05-Coteach', 'FA-05 · co-teacher', 1440, 'coteach', 'FA-05', '', ''),
   ('FA05-Phone', 'FA-05 Experiment · 375', 375, 'nov07', 'FA-05', '', ''),
 ]),
 ('FA-06', 'Assessments', [
   ('FA06-Assessments', 'FA-06 Assessments · populated', 1440, 'nov07', 'FA-06', '', ''),
   ('FA06-None-yet', 'FA-06 · no assessment yet · 26 Oct', 1440, 'oct26', 'FA-06', '', ''),
   ('FA06-No-courses', 'FA-06 · no courses assigned', 1440, 'none', 'FA-06', '', ''),
   ('FA06-Phone', 'FA-06 Assessments · 375', 375, 'nov07', 'FA-06', '', ''),
 ]),
 ('FA-07', 'Create assessment (4 steps)', [
   ('FA07-Step1', 'FA-07 · step 1 · experiment · 26 Oct', 1440, 'oct26', 'FA-07', '', ''),
   ('FA07-Step2-errors', 'FA-07 · step 2 · rules with errors', 1440, 'oct26', 'FA-07', '', 'cw-step2err'),
   ('FA07-Step3', 'FA-07 · step 3 · questions', 1440, 'oct26', 'FA-07', '', 'cw-step3'),
   ('FA07-Step4', 'FA-07 · step 4 · preview and create', 1440, 'oct26', 'FA-07', '', 'cw-step4'),
   ('FA07-Created', 'FA-07 · created and ready', 1440, 'oct26', 'FA-07', '', 'cw-created'),
   ('FA07-Saved-draft', 'FA-07 · saved as a draft', 1440, 'oct26', 'FA-07', '', 'cw-draft'),
   ('FA07-One-per-experiment', 'FA-07 · experiment already has one', 1440, 'nov07', 'FA-07', '', 'cw-has'),
   ('FA07-No-courses', 'FA-07 · no courses assigned', 1440, 'none', 'FA-07', '', ''),
   ('FA07-Phone', 'FA-07 · step 2 · 375', 375, 'oct26', 'FA-07', '', 'cw-step2'),
   ('FA07-Step4-phone', 'FA-07 · step 4 · 375', 375, 'oct26', 'FA-07', '', 'cw-step4'),
 ]),
 ('FA-08', 'Assessment · Summary', [
   ('FA08-Summary', 'FA-08 Summary · ready, 2 waiting', 1440, 'nov07', 'FA-08', '', ''),
   ('FA08-Draft', 'FA-08 · draft, no questions yet', 1440, 'oct26', 'FA-08', '', 'asm-draft'),
   ('FA08-Version2', 'FA-08 · version 2 after submissions', 1440, 'nov07', 'FA-08', '', 'v2'),
   ('FA08-Coteach', 'FA-08 · co-teacher', 1440, 'coteach', 'FA-08', '', ''),
   ('FA08-Phone', 'FA-08 Summary · 375', 375, 'nov07', 'FA-08', '', ''),
 ]),
 ('FA-09', 'Assessment · Questions', [
   ('FA09-Questions', 'FA-09 Questions · 4 questions', 1440, 'nov07', 'FA-09', '', ''),
   ('FA09-Add-from-bank', 'FA-09 · add from question bank panel', 1440, 'nov07', 'FA-09', '', 'panel'),
   ('FA09-New-version', 'FA-09 · added after submissions · version 2', 1440, 'nov07', 'FA-09', '', 'newver'),
   ('FA09-Coteach', 'FA-09 · co-teacher, read only', 1440, 'coteach', 'FA-09', '', ''),
   ('FA09-Phone', 'FA-09 Questions · 375', 375, 'nov07', 'FA-09', '', ''),
 ]),
 ('FA-10', 'Assessment · Settings', [
   ('FA10-Settings', 'FA-10 Settings', 1440, 'nov07', 'FA-10', '', ''),
   ('FA10-Errors', 'FA-10 · errors', 1440, 'nov07', 'FA-10', '', 'st-errors'),
   ('FA10-Rule-change', 'FA-10 · rule change after submissions', 1440, 'nov07', 'FA-10', '', 'st-warnrule'),
   ('FA10-Release-change', 'FA-10 · release change warning', 1440, 'nov07', 'FA-10', '', 'st-warnrel'),
   ('FA10-Coteach', 'FA-10 · co-teacher, read only', 1440, 'coteach', 'FA-10', '', ''),
   ('FA10-Phone', 'FA-10 Settings · 375', 375, 'nov07', 'FA-10', '', ''),
 ]),
 ('FA-11', 'Assessment · Preview', [
   ('FA11-Student-view', 'FA-11 Preview · as students see it', 1440, 'nov07', 'FA-11', '', ''),
   ('FA11-Answer-key', 'FA-11 · with the answer key', 1440, 'nov07', 'FA-11', '', 'pv-key'),
   ('FA11-Failed', 'FA-11 · preview couldn’t load', 1440, 'nov07', 'FA-11', '', 'pv-failed'),
   ('FA11-Coteach', 'FA-11 · co-teacher', 1440, 'coteach', 'FA-11', '', ''),
   ('FA11-Phone', 'FA-11 · answer key · 375', 375, 'nov07', 'FA-11', '', 'pv-key'),
 ]),
 ('FA-12', 'Assessment · Submissions · FA-22 Export CSV', [
   ('FA12-Submissions', 'FA-12 Submissions · 2 waiting', 1440, 'nov07', 'FA-12', '', ''),
   ('FA12-Marked', 'FA-12 · one marked, result not released', 1440, 'nov07', 'FA-12', '', 'marked'),
   ('FA12-Export', 'FA-22 Export CSV on FA-12', 1440, 'nov07', 'FA-12', '', 'marked-export'),
   ('FA12-Coteach', 'FA-12 · co-teacher', 1440, 'coteach', 'FA-12', '', ''),
   ('FA12-Phone', 'FA-12 Submissions · 375', 375, 'nov07', 'FA-12', '', ''),
 ]),
 ('FA-14', 'Question bank (Questions · Drafts to review)', [
   ('FA14-Question-bank', 'FA-14 Question bank · questions', 1440, 'nov07', 'FA-14', '', ''),
   ('FA14-Drafts', 'FA-14 · drafts to review', 1440, 'nov07', 'FA-14', '', 'qb-drafts'),
   ('FA14-Delete', 'FA-14 · delete a used question (dialog)', 1440, 'nov07', 'FA-14', '', 'qb-del'),
   ('FA14-Deleted', 'FA-14 · question deleted, history kept', 1440, 'nov07', 'FA-14', '', 'qb-deleted'),
   ('FA14-No-match', 'FA-14 · no question matches', 1440, 'nov07', 'FA-14', '', 'qb-nomatch'),
   ('FA14-Empty', 'FA-14 · empty bank, new teacher', 1440, 'new', 'FA-14', '', ''),
   ('FA14-Phone', 'FA-14 Question bank · 375', 375, 'nov07', 'FA-14', '', ''),
   ('FA14-Drafts-phone', 'FA-14 · drafts to review · 375', 375, 'nov07', 'FA-14', '', 'qb-drafts'),
 ]),
 ('FA-15', 'Add / edit question', [
   ('FA15-New', 'FA-15 Add a question', 1440, 'nov07', 'FA-15', '', ''),
   ('FA15-Errors', 'FA-15 · add a question with errors', 1440, 'nov07', 'FA-15', '', 'qe-err'),
   ('FA15-Used', 'FA-15 · edit a used question', 1440, 'nov07', 'FA-15', 'Q-0102', ''),
   ('FA15-Draft-review', 'FA-15 · review a draft', 1440, 'nov07', 'FA-15', 'D-3', ''),
   ('FA15-Phone', 'FA-15 · errors · 375', 375, 'nov07', 'FA-15', '', 'qe-err'),
 ]),
 ('FA-16', 'Draft questions with assistance', [
   ('FA16-Draft', 'FA-16 Draft with assistance · choices', 1440, 'nov07', 'FA-16', '', ''),
   ('FA16-Errors', 'FA-16 · nothing chosen', 1440, 'nov07', 'FA-16', '', 'dr-errors'),
   ('FA16-Busy', 'FA-16 · drafting', 1440, 'nov07', 'FA-16', '', 'dr-busy'),
   ('FA16-Drafts-list', 'FA-16 · drafts to review', 1440, 'nov07', 'FA-16', '', 'dr-list'),
   ('FA16-Failed', 'FA-16 · drafting failed', 1440, 'nov07', 'FA-16', '', 'dr-fail'),
   ('FA16-No-courses', 'FA-16 · no courses assigned', 1440, 'none', 'FA-16', '', ''),
   ('FA16-Phone', 'FA-16 · choices · 375', 375, 'nov07', 'FA-16', '', ''),
   ('FA16-List-phone', 'FA-16 · drafts to review · 375', 375, 'nov07', 'FA-16', '', 'dr-list'),
 ]),
 ('FA-17', 'Import questions (CSV)', [
   ('FA17-Choose', 'FA-17 Import · choose a file', 1440, 'nov07', 'FA-17', '', ''),
   ('FA17-Not-CSV', 'FA-17 · not a CSV file', 1440, 'nov07', 'FA-17', '', 'im-xlsx'),
   ('FA17-Row-errors', 'FA-17 · row errors block the import', 1440, 'nov07', 'FA-17', '', 'im-errors'),
   ('FA17-Confirm', 'FA-17 · confirm', 1440, 'nov07', 'FA-17', '', 'im-confirm'),
   ('FA17-Done', 'FA-17 · imported', 1440, 'nov07', 'FA-17', '', 'im-done'),
   ('FA17-Phone', 'FA-17 · row errors · 375', 375, 'nov07', 'FA-17', '', 'im-errors'),
 ]),
 ('FA-18', 'Marking queue', [
   ('FA18-Marking', 'FA-18 Marking · 2 waiting', 1440, 'nov07', 'FA-18', '', ''),
   ('FA18-All', 'FA-18 · all submissions, one marked', 1440, 'nov07', 'FA-18', '', 'mq-all+marked'),
   ('FA18-Nothing-waiting', 'FA-18 · nothing waiting · 26 Oct', 1440, 'oct26', 'FA-18', '', ''),
   ('FA18-No-courses', 'FA-18 · no courses assigned', 1440, 'none', 'FA-18', '', ''),
   ('FA18-Phone', 'FA-18 Marking · 375', 375, 'nov07', 'FA-18', '', ''),
 ]),
 ('FA-19', 'Mark a submission', [
   ('FA19-Mark', 'FA-19 Mark a submission · waiting', 1440, 'nov07', 'FA-19', 'ATT-0450', ''),
   ('FA19-Invalid-mark', 'FA-19 · mark out of range', 1440, 'nov07', 'FA-19', 'ATT-0450', 'mk-err'),
   ('FA19-Saved', 'FA-19 · mark saved, not confirmed', 1440, 'nov07', 'FA-19', 'ATT-0450', 'mk-saved'),
   ('FA19-Confirm', 'FA-19 · confirm marks (dialog)', 1440, 'nov07', 'FA-19', 'ATT-0450', 'mk-dialog'),
   ('FA19-Confirmed', 'FA-19 · confirmed, read only', 1440, 'nov07', 'FA-19', 'ATT-0450', 'mk-confirmed'),
   ('FA19-Released', 'FA-19 · result released · 15 Nov', 1440, 'nov15', 'FA-19', 'ATT-0450', ''),
   ('FA19-Phone', 'FA-19 · mark saved · 375', 375, 'nov07', 'FA-19', 'ATT-0450', 'mk-saved'),
 ]),
 ('FA-20', 'Students · FA-22 Export CSV', [
   ('FA20-Students', 'FA-20 Students · all', 1440, 'nov07', 'FA-20', '', ''),
   ('FA20-Inactive', 'FA-20 · inactive 14 days or more', 1440, 'nov07', 'FA-20', '', 'sl-inactive'),
   ('FA20-No-match', 'FA-20 · no student matches', 1440, 'nov07', 'FA-20', '', 'sl-nomatch'),
   ('FA20-Export', 'FA-22 Export CSV on FA-20', 1440, 'nov07', 'FA-20', '', 'marked+sl-export'),
   ('FA20-No-students', 'FA-20 · no students yet', 1440, 'new', 'FA-20', '', ''),
   ('FA20-No-courses', 'FA-20 · no courses assigned', 1440, 'none', 'FA-20', '', ''),
   ('FA20-Phone', 'FA-20 Students · 375', 375, 'nov07', 'FA-20', '', ''),
   ('FA20-Export-phone', 'FA-22 Export CSV on FA-20 · 375', 375, 'nov07', 'FA-20', '', 'marked+sl-export'),
 ]),
 ('FA-21', 'Student detail (per experiment)', [
   ('FA21-Student', 'FA-21 Student detail · waiting for marking', 1440, 'nov07', 'FA-21', 'GIT-2026-0418', ''),
   ('FA21-Marked', 'FA-21 · marked, result not released', 1440, 'nov07', 'FA-21', 'GIT-2026-0418', 'marked'),
   ('FA21-Released', 'FA-21 · result released · 15 Nov', 1440, 'nov15', 'FA-21', 'GIT-2026-0418', ''),
   ('FA21-Inactive', 'FA-21 · inactive student', 1440, 'nov07', 'FA-21', 'GIT-2026-0415', ''),
   ('FA21-Coteach', 'FA-21 · co-teacher', 1440, 'coteach', 'FA-21', 'GIT-2026-0418', ''),
   ('FA21-Phone', 'FA-21 Student detail · 375', 375, 'nov07', 'FA-21', 'GIT-2026-0418', ''),
 ]),
 ('XS', 'Shared surfaces (borrowed XS contract) and scoped refusals', [
   ('XS-Account-menu', 'XS-05 Account menu (borrowed)', 1440, 'nov07', 'FA-01', '', 'acct'),
   ('XS-Menu-phone', 'XS-05 Menu drawer · 375 (borrowed)', 375, 'nov07', 'FA-01', '', 'menu'),
   ('XS-Help', 'XS-07 Help & support (borrowed)', 1440, 'nov07', 'XS-07', '', ''),
   ('XS-Help-report', 'XS-07 Report a problem (borrowed)', 1440, 'nov07', 'XS-07', '', 'helpform'),
   ('XS-Signed-out', 'XS-03 Signed out (borrowed)', 1440, 'nov07', 'XS-03', '', ''),
   ('XS-Not-your-workspace', 'XS-06 Not your workspace (borrowed)', 1440, 'nov07', 'XS-06', '', ''),
   ('Refusal-Course', 'Refusal · course not assigned to you', 1440, 'nov07', 'NF', 'course', ''),
   ('Refusal-Co-teacher-marking', 'Refusal · co-teacher opens a submission', 1440, 'coteach', 'FA-19', 'ATT-0450', ''),
 ]),
]

# Responsive strip (screenshots and checks only): each owned ID's primary state at 1440, 1024, 768 and 375.
PRIMARY = {
 'FA-01': ('nov07', 'FA-01', '', ''), 'FA-02': ('nov07', 'FA-02', '', ''), 'FA-03': ('nov07', 'FA-03', 'MEZG523', ''),
 'FA-04': ('nov07', 'FA-04', '', ''), 'FA-05': ('nov07', 'FA-05', '', ''), 'FA-06': ('nov07', 'FA-06', '', ''),
 'FA-07': ('oct26', 'FA-07', '', 'cw-step2'), 'FA-08': ('nov07', 'FA-08', '', ''), 'FA-09': ('nov07', 'FA-09', '', ''),
 'FA-10': ('nov07', 'FA-10', '', 'st-errors'), 'FA-11': ('nov07', 'FA-11', '', 'pv-key'), 'FA-12': ('nov07', 'FA-12', '', ''),
 'FA-14': ('nov07', 'FA-14', '', ''), 'FA-15': ('nov07', 'FA-15', 'Q-0102', ''), 'FA-16': ('nov07', 'FA-16', '', ''),
 'FA-17': ('nov07', 'FA-17', '', 'im-errors'), 'FA-18': ('nov07', 'FA-18', '', ''), 'FA-19': ('nov07', 'FA-19', 'ATT-0450', 'mk-saved'),
 'FA-20': ('nov07', 'FA-20', '', ''), 'FA-21': ('nov07', 'FA-21', 'GIT-2026-0418', ''), 'FA-22': ('nov07', 'FA-20', '', 'marked+sl-export'),
}
RESP_W = [1440, 1024, 768, 375]

def comp_boards():
    for f, t, w, sc, st, rec, pre in LIVE:
        if f != 'Main': yield ('Start', f, t, w, sc, st, rec, pre)
    for rid, name, bs in ROWS:
        for b in bs: yield (rid,) + b

def resp_boards():
    for sid, (sc, st, rec, pre) in PRIMARY.items():
        for w in RESP_W:
            yield ('R-' + sid.replace('-', '') + '-' + str(w), sid + ' · ' + str(w), w, sc, st, rec, pre)

def wrap(title, note, w, h, sc, st, rec, pre, css):
    links = ''.join('<link rel="stylesheet" href="./%s">\n' % c for c in css)
    return ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
      '<title>' + html.escape(title) + '</title>\n<script src="./support.js"></script>\n' + links +
      '</head>\n<body>\n<x-dc>\n<helmet>\n<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400..800&amp;display=swap" rel="stylesheet">\n<style>\nbody{margin:0;background:#F3F4F9}\n</style>\n</helmet>\n'
      '<dc-import name="Main" scenario="' + sc + '" start="' + st + '" rec="' + rec + '" preset="' + pre.replace('+', ',') + '" hint-size="100%,' + str(h) + 'px"></dc-import>\n</x-dc>\n'
      "<script type=\"text/x-dc\" data-dc-script data-props='{\"$preview\":{\"width\":" + str(w) + ',"height":' + str(h) + "}}'>\n// " + note + '\nclass Component extends DCLogic { renderVals() { return {}; } }\n</script>\n</body>\n</html>\n')

def note_for(w, sc, st, rec, pre):
    return ('Board: the Faculty role preview (Main.dc.html) at ' + str(w) + ' px, scenario ' + sc + ', starting at ' + st +
            (' (' + rec + ')' if rec else '') + (', preset ' + pre.replace('+', ', ') if pre else '') + '.')

def css_for(proj):
    return ['core.css', 'rb.css', 'rb-kit.css', 'fa.css'] + (['fa-r1.css'] if os.path.exists(os.path.join(proj, 'fa-r1.css')) else [])

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'harness':
        tw = os.path.join(SP, 'harness', sys.argv[2]); proj = sys.argv[3]
        os.makedirs(tw, exist_ok=True)
        css = css_for(proj); n = 0
        for b in list(comp_boards()) + [('R',) + r for r in resp_boards()]:
            _, f, t, w, sc, st, rec, pre = b
            open(os.path.join(tw, 'T-' + f + '.dc.html'), 'w').write(wrap(t, note_for(w, sc, st, rec, pre), w, 900, sc, st, rec, pre, css)); n += 1
        print(n, 'wrappers in', tw, 'css', css)
    elif cmd == 'spec':
        flags = sys.argv[3:]
        spec = [{'file': 'fa/T-' + b[1] + '.dc.html', 'width': b[3], 'name': b[1]} for b in comp_boards()]
        if 'resp' in flags:
            spec += [{'file': 'fa/T-' + r[0] + '.dc.html', 'width': r[2], 'name': r[0]} for r in resp_boards()]
        if 'extra' in flags:
            for s in spec: s['extra'] = "[...new Set([...document.querySelectorAll('#dc-root *')].flatMap(e => typeof e.className === 'string' ? e.className.split(/\\s+/) : (e.getAttribute('class') || '').split(/\\s+/)).filter(Boolean))]"
        json.dump(spec, open(sys.argv[2], 'w'), indent=1)
        print(len(spec), 'renders')
