# Region map shared by the R2 extract and build scripts (markers are exact lines in Main.dc.html, which stays locked).
T = [  # (name, start marker, end marker) — template regions, in file order
 ('home',     '      <!-- ══════════ ST-01 Home ══════════ -->',                          '      <!-- ══════════ ST-02 My courses'),
 ('courses',  '      <!-- ══════════ ST-02 My courses',                                   '      <!-- ══════════ ST-03 Course'),
 ('course',   '      <!-- ══════════ ST-03 Course',                                       '      <!-- ══════════ Message pages'),
 ('msg',      '      <!-- ══════════ Message pages',                                      '      <!-- ══════════ ST-05 Experiment hub'),
 ('hubhead',  '      <!-- ══════════ ST-05 Experiment hub',                               '      <!-- Overview -->'),
 ('overview', '      <!-- Overview -->',                                                  '      <!-- ST-06 Resources -->'),
 ('resources','      <!-- ST-06 Resources -->',                                           '      <!-- ST-07 Simulation'),
 ('simprog',  '      <!-- ST-07 Simulation',                                              '      <!-- Hub · Assessment tab -->'),
 ('asmttab',  '      <!-- Hub · Assessment tab -->',                                      '      <!-- ══════════ ST-08 WEB simulation'),
 ('fpage',    '      <!-- ══════════ ST-08 WEB simulation',                               '      <!-- ══════════ ST-15 Progress'),
 ('progress', '      <!-- ══════════ ST-15 Progress',                                     '      <!-- ══════════ ST-16 Format feedback'),
 ('feedback', '      <!-- ══════════ ST-16 Format feedback',                              '      <!-- ══════════ ST-11 Assessments'),
 ('alist',    '      <!-- ══════════ ST-11 Assessments',                                  '      <!-- ══════════ ST-12 Assessment'),
 ('aintro',   '      <!-- ══════════ ST-12 Assessment',                                   '      <!-- ══════════ ST-14 Result'),
 ('result',   '      <!-- ══════════ ST-14 Result',                                       '      <!-- ══════════ ST-18 My device'),
 ('device',   '      <!-- ══════════ ST-18 My device',                                    '      <!-- ══════════ Help & support'),
 ('focusatt', '  <!-- ══════════ Focused task layouts',                                   '  <sc-if value="{{ is.act }}"'),
 ('focusact', '  <sc-if value="{{ is.act }}"',                                            '  <sc-if value="{{ is.out }}"'),
]
L = [  # logic regions replaced (presentation only)
 ('msg.js', '  msg(kind, r, w, exp) {', '  // ── view models'),
 ('vm',     '  homeVM(w) {',            '  helpVM(w, u) {'),
]
VM_FILES = ['vm-shared.js', 'vm-home.js', 'vm-courses.js', 'vm-hub.js', 'vm-fpage.js', 'vm-prog.js', 'vm-fb.js', 'vm-asmt.js', 'vm-dev.js']
def span(text, start, end):
    assert text.count(start) == 1, ('start not unique', start)
    i = text.index(start); j = text.index(end, i + len(start))
    return i, j
