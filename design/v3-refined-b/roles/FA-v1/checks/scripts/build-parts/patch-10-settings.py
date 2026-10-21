# FA-10: the side panel explains how a change applies (versions), from the existing rules
rep("""      hasWarn: pinned.length > 0 && (ruleChanged || relChanged) && !f.saved,""",
"""      hasWarn: pinned.length > 0 && (ruleChanged || relChanged) && !f.saved,
      sideVer: 'Version ' + cfg.n + ' · since ' + cfg.since,
      sideD: pinned.length ? who + (pinned.length === 1 ? ' has' : ' have') + ' submitted version ' + cfg.n + '. Changing a rule or when results are shown makes version ' + (cfg.n + 1) + '; ' + (pinned.length === 1 ? 'that submission keeps' : 'their submissions keep') + ' version ' + cfg.n + '.' : 'No one has submitted version ' + cfg.n + ' yet, so changes apply to it directly.',
      sideD2: 'Changing the name or the introduction never makes a new version.',""")
