# Sparse states (P8) made consistent across the role: a teacher without a course (or without an experiment to work on)
# sees the same compact message card on FA-04, FA-06, FA-07 and FA-16 as on FA-02, FA-14, FA-17, FA-18 and FA-20.
# Presentation only: the same conditions, copy and destinations as before.

# FA-04: the toolbar and table only when there is an experiment to list
rep("""      rows, has: ok && rows.length > 0, none: ok && all.length > 0 && rows.length === 0, empty: ok && !all.length,""",
"""      rows, has: ok && rows.length > 0, none: ok && all.length > 0 && rows.length === 0, empty: ok && !all.length, notEmpty: !(ok && !all.length),""")

# FA-06: the list surface only when the teacher has a course
rep("""      rows, has: rows.length > 0, none: scope.length > 0 && !rows.length, empty: !scope.length, hasAny: scope.length > 0, canCreate,""",
"""      rows, has: rows.length > 0, none: scope.length > 0 && !rows.length, empty: !scope.length, hasAny: scope.length > 0, canCreate, noCourse: !canCreate,""")

# FA-07: nothing to choose in step 1 → message card instead of an empty step
rep("""title: titles[c.step], steps, notDone: c.step < 5, done: c.step === 5,""",
"""title: titles[c.step], steps, notDone: c.step < 5, done: c.step === 5, noExp: !this.myExps().length, hasExp: this.myExps().length > 0,""")

# FA-16 (R1 screen, no-course state not shown in R1): the same compact message card as FA-17
rep("""      <section class="rk-surface fa-narrow"><div class="rk-state"><span class="rk-state-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#fai-draft"></use></svg></span><p class="rk-state-t">Nothing to draft from yet</p><p class="rk-state-d">Drafts are made from an experiment you teach. Your Institute Admin hasn’t assigned you a course yet.</p><a class="rb-btn" href="#FA-14" onClick="{{ nav.bank }}">Back to Question bank</a></div></section>""",
"""      <section class="rk-surface fr-msgcard" aria-labelledby="fa-dr-none">
        <div class="fa-inlinemsg">
          <span class="fa-msg-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#fai-draft"></use></svg></span>
          <h2 class="rb-h2" id="fa-dr-none">Nothing to draft from yet</h2>
          <p class="fa-msg-d">Drafts are made from an experiment you teach. Your Institute Admin hasn’t assigned you a course yet.</p>
          <div class="fa-msg-act"><a class="rb-btn" href="#FA-14" onClick="{{ nav.bank }}">Back to Question bank</a></div>
        </div>
      </section>""")
