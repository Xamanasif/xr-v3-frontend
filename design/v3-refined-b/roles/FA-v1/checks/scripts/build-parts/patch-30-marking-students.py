# FA-18 Marking queue: oldest wait beside the count, waiting age per row
rep("""      const s = this.stu(t.st), a = this.asm(t.asm), w = this.waiting(t), cfg = this.verOf(a, t.ver), drafted = w && !!(t.draft && t.draft.marks && Object.keys(t.draft.marks).length);""",
"""      const s = this.stu(t.st), a = this.asm(t.asm), w = this.waiting(t), cfg = this.verOf(a, t.ver), drafted = w && !!(t.draft && t.draft.marks && Object.keys(t.draft.marks).length), d0 = this.daysSince(t.subIso);""")
rep("""        aria: (w ? 'Mark ' : 'View marks for ') + s.n + ', ' + t.id, open: this.link({ s: 'FA-19', att: t.id }) };
    });""",
"""        aria: (w ? 'Mark ' : 'View marks for ') + s.n + ', ' + t.id, open: this.link({ s: 'FA-19', att: t.id }),
        hasAgo: w, ago: d0 <= 0 ? 'Today' : this.plural(d0, 'day') + ' ago' };
    });""")
rep("""      someWait: wAll.length > 0, markNext: wAll.length ? this.link({ s: 'FA-19', att: wAll[0].id }) : null,""",
"""      someWait: wAll.length > 0, markNext: wAll.length ? this.link({ s: 'FA-19', att: wAll[0].id }) : null,
      hasOldest: wAll.length > 0, oldest: wAll.length ? (d => d <= 0 ? 'Oldest submitted today' : 'Oldest waiting ' + this.plural(d, 'day'))(this.daysSince(wAll[0].subIso)) : '',""")

# FA-20 Students: per-format summary for the experiment in view (all students with access), title line
rep("""    return { hasCourse, noCourse: !hasCourse, asOf: W.clock.day,""",
"""    const sumE = f.exp !== 'all' ? this.expo(f.exp) : one, sumN = sumE ? this.stuOf(sumE.id).length : 0;
    return { hasCourse, noCourse: !hasCourse, asOf: W.clock.day,
      titleSub: 'As of ' + W.clock.day + ' · progress in words, per format',
      hasSum: !!sumE && sumN > 0, sum: sumE && sumN ? this.fmProg(sumE.id) : [], sumH: 'All ' + this.plural(sumN, 'student') + ' with access, by format', sumAria: 'Progress by format for all students with access to ' + (sumE ? sumE.t : ''),""")

# FA-21 Student detail: the confirmed total in the same form as Mark a submission
rep("""      canMark: sa.k === 'wait', canView: sa.k === 'marked', goMark: t ? this.link({ s: 'FA-19', att: t.id }) : null,""",
"""      canMark: sa.k === 'wait', canView: sa.k === 'marked', goMark: t ? this.link({ s: 'FA-19', att: t.id }) : null, hasActs: sa.k === 'wait' || sa.k === 'marked',
      scoreBig: sa.k === 'marked' ? sa.sc.total + ' of ' + sa.sc.of + ' marks' : '', scoreD: sa.k === 'marked' ? (sa.sc.passed ? 'Passed' : 'Not passed') + ' · pass mark ' + sa.sc.pm : '',""")
