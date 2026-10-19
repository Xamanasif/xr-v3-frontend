# Local-only test fixtures (never published): thin wrappers that start Main in a given state.
import sys, json, os
out = sys.argv[1]
spec = json.load(open(sys.argv[2]))
TPL = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>fixture</title>
<script src="./support.js"></script>
<link rel="stylesheet" href="./core.css"><link rel="stylesheet" href="./rb.css"><link rel="stylesheet" href="./rb-kit.css"><link rel="stylesheet" href="./xs-shared.css">
</head><body><x-dc>
<helmet><link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400..800&amp;display=swap" rel="stylesheet"><style>body{margin:0;background:#F3F4F9}</style></helmet>
<dc-import name="Main" %s hint-size="100%%,900px"></dc-import>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":900}}'>
class Component extends DCLogic { renderVals() { return {}; } }
</script></body></html>
'''
for name, attrs in spec.items():
    parts = []
    for k, v in attrs.items():
        parts.append('%s="{{ %s }}"' % (k, 'true' if v else 'false') if isinstance(v, bool) else '%s="%s"' % (k, v))
    open(os.path.join(out, 'fx-' + name + '.dc.html'), 'w').write(TPL % ' '.join(parts))
print('fixtures', len(spec))
