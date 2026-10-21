# One sheet: representative Student screens at 1440, 1024, 768, 375 and 320, first screenful of each, from the final renders.
# usage: python3 -I fx_responsive_sheet.py <out.png>
import pathlib, sys
from PIL import Image, ImageDraw, ImageFont
R = pathlib.Path('/tmp/claude-0/fx/run'); OUT = pathlib.Path(sys.argv[1])
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20); FS = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 17)
except Exception:
    F = FS = ImageFont.load_default()
ROWS = [('01-learn', 'ST-01 Home'), ('05-learn', 'ST-05 Experiment · Overview'), ('11-assess', 'ST-11 Assessments'), ('13-inprog', 'ST-13 Attempt'),
        ('15-learn', 'ST-15 Progress'), ('18-dtrfwd', 'ST-18 My device · request forwarded')]
COLS = [(1440, 900), (1024, 900), (768, 1000), (375, 812), (320, 700)]
H, GAP, PAD, LBL = 560, 18, 24, 34
def src(name, w):
    # latest render of the case at this width: the last fix, then the first fix, then the verification lanes
    for d in (['fix2-320'] if w == 320 else ['fix2']) + ['fix', {1440: 'wB', 375: 'wB', 1024: 'wA', 768: 'wA', 320: 'w320'}[w]]:
        p = R / d / f'{name}-{w}.png'
        if p.exists(): return p
    return None
tiles = []
for name, label in ROWS:
    row = []
    for w, vh in COLS:
        p = src(name, w)
        im = Image.open(p).convert('RGB'); im = im.crop((0, 0, im.width, min(vh, im.height)))
        sc = H / im.height; row.append((w, im.resize((max(1, int(im.width * sc)), H))))
    tiles.append((label, row))
W = PAD * 2 + max(sum(t.width for _, t in row) + GAP * (len(row) - 1) for _, row in tiles)
sheet = Image.new('RGB', (W, 64 + len(tiles) * (H + LBL + 40)), (226, 228, 238)); d = ImageDraw.Draw(sheet)
d.rectangle((0, 0, W, 56), fill=(20, 27, 94)); d.text((PAD, 16), 'Student · final design · the same screens at 1440, 1024, 768, 375 and 320 (first screenful of each)', fill=(255, 255, 255), font=F)
y = 72
for label, row in tiles:
    d.text((PAD, y), label, fill=(20, 27, 94), font=F); x = PAD; y2 = y + LBL
    for w, t in row:
        sheet.paste(t, (x, y2)); d.text((x, y2 + H + 6), f'{w}px', fill=(70, 75, 110), font=FS); x += t.width + GAP
    y = y2 + H + 40
sheet.save(OUT, optimize=True); print(OUT, sheet.size)
