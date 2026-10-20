# Side-by-side before/after images: version 16 board render (left) and version 20 board render (right), scaled together.
# usage: python3 -I beforeafter.py <v16 dir> <v17 boards dir> <out dir>
import sys, os
from PIL import Image, ImageDraw
V16, V17, OUT = sys.argv[1:4]
os.makedirs(OUT, exist_ok=True)
PAIRS = [('13', 'CM05-Published-1440'), ('14', 'CM06-EditCatalogue-1440'), ('15', 'CM07-EditDelivery-1440'), ('16', 'CM08-UpdateDetail-1440'),
         ('17', 'C14-PubAwaiting-1440'), ('18', 'C16-PubReleased-1440'), ('19', 'C10-Released-1440'), ('20', 'C12-Withdrawn-1440'),
         ('21', 'R-Published-1024'), ('22', 'R-Published-375'), ('23', 'R-UpdateDetail-375')]
for num, n in PAIRS:
    a = Image.open(os.path.join(V16, n + '.png')).convert('RGB')
    b = Image.open(os.path.join(V17, n + '.png')).convert('RGB')
    w = a.width
    s = 0.5 if w >= 1024 else 1.0
    a = a.resize((int(a.width * s), int(a.height * s)), Image.LANCZOS)
    b = b.resize((int(b.width * s), int(b.height * s)), Image.LANCZOS)
    pad, head = 24, 44
    W = a.width + b.width + pad * 3
    H = max(a.height, b.height) + head + pad
    S = Image.new('RGB', (W, H), (226, 228, 236))
    d = ImageDraw.Draw(S)
    d.text((pad, 14), 'Version 16 (before) - ' + n, fill=(20, 27, 94))
    d.text((pad * 2 + a.width, 14), 'Version 20 (final design for acceptance) - ' + n, fill=(20, 27, 94))
    S.paste(a, (pad, head)); S.paste(b, (pad * 2 + a.width, head))
    S.save(os.path.join(OUT, num + '-' + n + '.png'), optimize=True)
    print(num, n, S.size)
