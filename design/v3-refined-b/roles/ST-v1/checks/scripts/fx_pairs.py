# Before / after pair images and two overview sheets from fx_compare.mjs output.
import sys, pathlib
from PIL import Image, ImageDraw, ImageFont
SRC = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22); FS = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)
except Exception:
    F = FS = ImageFont.load_default()
NAV, BG = (20, 27, 94), (226, 228, 238)
def label(img, text, sub=''):
    band = Image.new('RGB', (img.width, 64), NAV); d = ImageDraw.Draw(band); d.text((16, 8), text, fill=(255, 255, 255), font=F)
    if sub: d.text((16, 36), sub, fill=(200, 205, 235), font=FS)
    t = Image.new('RGB', (img.width, img.height + 64), (255, 255, 255)); t.paste(band, (0, 0)); t.paste(img, (0, 64)); return t
pairs = sorted({p.name.rsplit('-', 1)[0] for p in SRC.glob('*-before.png')})
for key in pairs:
    a = Image.open(SRC / f'{key}-before.png').convert('RGB'); b = Image.open(SRC / f'{key}-after.png').convert('RGB')
    scr, sc, w = key.split('-')[0] + '-' + key.split('-')[1], key.split('-')[2], key.split('-')[-1]
    cap = 3600 if int(w) > 400 else 4200
    a = a.crop((0, 0, a.width, min(a.height, cap))); b = b.crop((0, 0, b.width, min(b.height, cap)))
    A = label(a, 'Before · original design', f'{scr} · {sc} · {w}'); B = label(b, 'After · final design', f'{scr} · {sc} · {w}')
    H = max(A.height, B.height); s = Image.new('RGB', (A.width + B.width + 48, H + 32), BG); s.paste(A, (16, 16)); s.paste(B, (A.width + 32, 16))
    if s.width > 2400: s = s.resize((s.width // 2, s.height // 2))
    s.save(OUT / f'pair-{key}.png')
# overview sheets: every screen after, at 1440 (top 900 px) and at 375 (top 1400 px)
for w, cw, ch, cols, name in [(1440, 720, 450, 4, 'Final-overview-desktop-1440.png'), (375, 300, 1120, 8, 'Final-overview-phone-375.png')]:
    tiles = []
    for p in sorted(SRC.glob(f'*-{w}-after.png')):
        im = Image.open(p).convert('RGB'); im = im.crop((0, 0, im.width, min(im.height, int(ch * im.width / cw)))); im = im.resize((cw, int(im.height * cw / im.width)))
        lab = Image.new('RGB', (cw, 30), NAV); ImageDraw.Draw(lab).text((8, 5), p.name.replace(f'-{w}-after.png', ''), fill=(255, 255, 255), font=FS)
        t = Image.new('RGB', (cw, ch + 30), (255, 255, 255)); t.paste(lab, (0, 0)); t.paste(im, (0, 30)); tiles.append(t)
    rows = [tiles[i:i + cols] for i in range(0, len(tiles), cols)]
    S = Image.new('RGB', (cols * cw + (cols + 1) * 12, len(rows) * (ch + 30) + (len(rows) + 1) * 12), BG)
    for ri, r in enumerate(rows):
        for ci, t in enumerate(r): S.paste(t, (12 + ci * (cw + 12), 12 + ri * (ch + 42)))
    S.save(OUT / name); print(name, S.size)
print(len(pairs), 'pairs')
