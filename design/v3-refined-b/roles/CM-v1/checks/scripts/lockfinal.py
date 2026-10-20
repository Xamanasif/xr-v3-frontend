# Write FOUNDATION-LOCK.json and FOUNDATION-LOCK.md for a delivery from the files actually in its project/ folder.
# Base files are re-hashed and compared with the owner pack's lock; local additions and wrappers are hashed.
# usage: python3 -I lockfinal.py <delivery dir> <v16 FOUNDATION-LOCK.json> <owner pack FOUNDATION-LOCK.json> <date> <canvas version label>
import hashlib, json, os, sys

D, PREV, PACKLOCK, DATE, VERSION = sys.argv[1:6]
P = os.path.join(D, 'project')
sha = lambda f: hashlib.sha256(open(f, 'rb').read()).hexdigest()
lock = json.load(open(PREV, encoding='utf-8'))
pack = json.load(open(PACKLOCK, encoding='utf-8'))

for name in ['core.css', 'rb.css', 'rb-kit.css']:
    ref = pack['baseFiles']['references/v3/project/' + name]
    got = sha(os.path.join(P, name))
    lock['baseFilesShipped']['project/' + name].update({'sha256': got, 'referenceSha256': ref, 'byteIdentical': got == ref})

wr = sorted(f for f in os.listdir(P) if f.endswith('.dc.html') and f != 'Main.dc.html')
canvas = json.load(open(os.path.join(P, 'canvas.json'), encoding='utf-8'))
kinds = {
    'project/cm.css': 'role stylesheet (cm- prefix), additive, tokens only from core.css/rb.css',
    'project/xs-borrowed.css': 'borrowed shared-surface stylesheet (xsb- prefix) implementing the v46 XS contract in V3 tokens; replace with the XS delivery',
    'project/Main.dc.html': 'role preview root: markup + inline DCLogic (one store, connected subviews)',
    'project/canvas.json': 'canvas index: pages, %d boards (Main + %d inspection wrappers), notes' % (len(canvas['boards']), len(wr))
}
lock['localAdditions'] = {k: {'sha256': sha(os.path.join(D, k)), 'kind': v, 'bytes': os.path.getsize(os.path.join(D, k))} for k, v in kinds.items()}
lock['inspectionWrappers'] = {
    'note': '%d newly authored wrappers; each imports Main.dc.html with screen/record/scenario/preset props and sets its frame to the measured content height. Not recovered originals.' % len(wr),
    'count': len(wr),
    'sha256': {'project/' + f: sha(os.path.join(P, f)) for f in wr}
}
lock['canvasVersion'] = VERSION
lock['generatedAt'] = DATE
json.dump(lock, open(os.path.join(D, 'FOUNDATION-LOCK.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

ok = all(v['byteIdentical'] for v in lock['baseFilesShipped'].values())
md = ['# FOUNDATION-LOCK — Content Manager · ' + lock['foundationId'], '',
      'Readable summary of `FOUNDATION-LOCK.json` (the machine file is the source of truth). Canvas version ' + VERSION + ', generated ' + DATE + '.', '',
      '## Base files — byte-identical to the owner pack: **' + ('yes' if ok else 'NO') + '**', '',
      '| File | sha256 | Owner pack sha256 | Identical |', '| --- | --- | --- | --- |']
for k, v in lock['baseFilesShipped'].items():
    md.append('| `' + k + '` | `' + v['sha256'] + '` | `' + v['referenceSha256'] + '` | ' + ('yes' if v['byteIdentical'] else 'NO') + ' |')
md += ['', 'Not shipped (read-only references in the pack): ' + ', '.join('`' + k + '`' for k in lock['baseFilesNotShipped']) + '.', '',
       '## Local additions', '', '| File | Kind | Bytes | sha256 |', '| --- | --- | --- | --- |']
for k, v in lock['localAdditions'].items():
    md.append('| `' + k + '` | ' + v['kind'] + ' | ' + str(v['bytes']) + ' | `' + v['sha256'] + '` |')
md += ['', '## Inspection wrappers', '', lock['inspectionWrappers']['note'], '', '| Wrapper | sha256 |', '| --- | --- |']
for k, v in lock['inspectionWrappers']['sha256'].items():
    md.append('| `' + k + '` | `' + v + '` |')
rt = lock['designHostRuntime']
md += ['', '## Not shipped', '',
       '- Design host runtime `support.js` (contract ' + rt['contract'] + ', sha256 `' + rt['sha256'] + '`): ' + rt['note'],
       '- Fonts: ' + lock['fonts']['family'] + ' — ' + lock['fonts']['loading'] + '; no font binaries shipped.',
       '- Tokens changed: ' + ('yes' if lock['tokensChanged'] else 'no') + '.']
open(os.path.join(D, 'FOUNDATION-LOCK.md'), 'w', encoding='utf-8').write('\n'.join(md) + '\n')
print('base identical:', ok, '· wrappers:', len(wr), '· boards:', len(canvas['boards']))
for k, v in lock['localAdditions'].items(): print(k, v['sha256'][:16], v['bytes'])
