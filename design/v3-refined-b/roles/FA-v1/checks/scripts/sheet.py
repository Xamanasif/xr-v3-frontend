import sys, json
from PIL import Image, ImageDraw, ImageFont
# usage: sheet.py out.png colwidth img1 img2 ...
out, cw = sys.argv[1], int(sys.argv[2]); files = sys.argv[3:]
ims = []
for f in files:
    im = Image.open(f).convert('RGB'); w, h = im.size; s = cw / w
    ims.append((f.split('/')[-1], im.resize((cw, int(h * s)), Image.LANCZOS)))
import os
cols = int(os.environ.get("COLS", "2")); pad = 16; lab = 22
rows = [ims[i:i+cols] for i in range(0, len(ims), cols)]
H = sum(max(im.size[1] for _, im in r) + lab + pad for r in rows) + pad
W = cols * cw + (cols + 1) * pad
sheet = Image.new('RGB', (W, H), (60, 60, 70)); d = ImageDraw.Draw(sheet)
y = pad
for r in rows:
    x = pad
    for name, im in r:
        d.text((x, y + 4), name, fill=(255, 255, 255))
        sheet.paste(im, (x, y + lab)); x += cw + pad
    y += max(im.size[1] for _, im in r) + lab + pad
sheet.save(out); print(out, sheet.size)
