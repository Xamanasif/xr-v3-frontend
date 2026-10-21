# Shared-component subviews: compare the ORIGINAL and FINAL crops that fx_subcmp.mjs wrote, interiors inset past the rounded
# corners (which show the page behind them), and add interiorSame to subcmp.json.
# usage: python3 -I fx_subcmp_interior.py <subcmp dir> [inset]
import json, pathlib, sys
from PIL import Image, ImageChops
D = pathlib.Path(sys.argv[1]); INSET = int(sys.argv[2]) if len(sys.argv) > 2 else 16
rows = json.loads((D / 'subcmp.json').read_text())
for r in rows:
    a, b = D / f"{r['part']}-{r['w']}-original.png", D / f"{r['part']}-{r['w']}-final.png"
    if not (a.exists() and b.exists()): r['interiorSame'] = None; r['note'] = 'crop missing'; continue
    A, B = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    if A.size != B.size: r['interiorSame'] = False; r['note'] = f'different size {A.size} vs {B.size}'; continue
    w, h = A.size; i = min(INSET, max(0, w // 4), max(0, h // 4))
    box = (i, i, w - i, h - i)
    r['interiorSame'] = ImageChops.difference(A.crop(box), B.crop(box)).getbbox() is None
    r['note'] = f'interior compared inset {i} px (rounded corners show the page behind)'
(D / 'subcmp.json').write_text(json.dumps(rows, indent=1) + '\n')
same = sum(1 for r in rows if r['interiorSame'])
print(f'{same} of {len(rows)} shared-component renders identical inside · whole-crop identical: {sum(1 for r in rows if r["same"])}')
for r in rows:
    if not r['interiorSame']: print('  differs:', r['part'], r['w'], r['note'])
