# One sheet of the interaction-state crops: a row per control, columns default · hover · keyboard focus · pressed.
import json, pathlib, sys
from PIL import Image, ImageDraw, ImageFont
S = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(sys.argv[2])
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15); FS = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
except Exception:
    F = FS = ImageFont.load_default()
res = json.loads((S / 'states.json').read_text())
cols = ['default', 'hover', 'focus', 'pressed']; CW, LW, PAD = 300, 300, 12
rows = []
for r in res:
    if 'missing' in r: continue
    ims = {c: Image.open(S / f"{r['k']}-{c}.png").convert('RGB') for c in cols if (S / f"{r['k']}-{c}.png").exists()}
    h = max(min(int(im.height * (1 if im.width > 1.5 * CW else min(1, CW / im.width))), 160) for im in ims.values()) + 2 * PAD
    row = Image.new('RGB', (LW + len(cols) * (CW + PAD) + PAD, h), (255, 255, 255))
    d = ImageDraw.Draw(row); d.text((PAD, PAD), r['label'], fill=(20, 27, 94), font=F)
    for i, c in enumerate(cols):
        if c not in ims: d.text((LW + i * (CW + PAD) + PAD, PAD + 4), '(no pressed look for a field)', fill=(110, 115, 140), font=FS); continue
        im = ims[c]
        if im.width > 1.5 * CW: im = im.crop((0, 0, CW, im.height))   # a very wide control (answer row, comment box): show its left part at full size
        sc = min(1, CW / im.width, 160 / im.height); im = im.resize((max(1, int(im.width * sc)), max(1, int(im.height * sc))))
        row.paste(im, (LW + i * (CW + PAD) + PAD, PAD))
    rows.append(row)
head = Image.new('RGB', (rows[0].width, 40), (20, 27, 94)); d = ImageDraw.Draw(head)
d.text((PAD, 11), 'Control', fill=(255, 255, 255), font=F)
for i, c in enumerate(['Default', 'Hover', 'Keyboard focus', 'Pressed']): d.text((LW + i * (CW + PAD) + PAD, 11), c, fill=(255, 255, 255), font=F)
H = 40 + sum(r.height + 2 for r in rows); sheet = Image.new('RGB', (rows[0].width, H), (226, 228, 238)); sheet.paste(head, (0, 0)); y = 40
for r in rows: sheet.paste(r, (0, y)); y += r.height + 2
sheet.save(OUT); print(OUT, sheet.size)
