# Vertical thumbnail: clean 3D frame (no captions) + benefit-first headline. Usage: python3 tools/thumb.py <frame.jpg> <out.jpg>
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

src, out = sys.argv[1], sys.argv[2]
W, H = 1080, 1920
im = Image.open(src).convert('RGB').resize((W, H), Image.LANCZOS)
F = 'fonts/Inter-Black.otf'
font = lambda s: ImageFont.truetype(F, s)

# darken the top so the headline pops
top = Image.new('L', (W, H), 0); g = ImageDraw.Draw(top)
for y in range(760): g.line([(0, y), (W, y)], fill=int(170 * (1 - y / 760) ** 1.4))
im = Image.composite(Image.new('RGB', (W, H), (12, 10, 30)), im, top)
d = ImageDraw.Draw(im)

def outlined(text, cx, cy, size, fill, stroke=14, rot=0):
    f = font(size); bb = d.textbbox((0, 0), text, font=f, stroke_width=stroke)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    layer = Image.new('RGBA', (w + 40, h + 40), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
    ld.text((20 - bb[0], 20 - bb[1]), text, font=f, fill=fill, stroke_width=stroke, stroke_fill=(10, 10, 10))
    if rot: layer = layer.rotate(rot, resample=Image.BICUBIC, expand=True)
    im.paste(layer, (int(cx - layer.width / 2), int(cy - layer.height / 2)), layer)

def badge(text, cx, cy, size, bg, fg=(255, 255, 255), rot=0, pad=34):
    f = font(size); bb = d.textbbox((0, 0), text, font=f); w, h = bb[2] - bb[0], bb[3] - bb[1]
    bw, bh = w + pad * 2, h + pad * 1.4
    layer = Image.new('RGBA', (int(bw) + 40, int(bh) + 40), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
    ld.rounded_rectangle([8, 8, bw + 32, bh + 32], radius=26, fill=(10, 10, 10))
    ld.rounded_rectangle([20, 20, bw + 20, bh + 20], radius=20, fill=bg, outline=(255, 255, 255), width=8)
    ld.text((20 + pad - bb[0], 20 + (bh - h) / 2 - bb[1]), text, font=f, fill=fg)
    if rot: layer = layer.rotate(rot, resample=Image.BICUBIC, expand=True)
    sh = layer.copy().filter(ImageFilter.GaussianBlur(10))
    im.paste((0, 0, 0), (int(cx - layer.width / 2) + 8, int(cy - layer.height / 2) + 14), sh)
    im.paste(layer, (int(cx - layer.width / 2), int(cy - layer.height / 2)), layer)

def fit(text, size, maxw):
    while d.textbbox((0, 0), text, font=font(size), stroke_width=14)[2] > maxw: size -= 4
    return size
s1 = fit('CASH or', 190, 900); s2 = fit('STOCK?', 230, 980)
cw = d.textbbox((0, 0), 'CASH ', font=font(s1), stroke_width=14)[2]; ow = d.textbbox((0, 0), 'or', font=font(int(s1 * 0.62)), stroke_width=14)[2]
x0 = 540 - (cw + ow) / 2
outlined('CASH', x0 + cw / 2 - 20, 175, s1, (124, 214, 128), rot=3)
outlined('or', x0 + cw + ow / 2, 195, int(s1 * 0.62), (255, 255, 255))
outlined('STOCK?', 540, 375, s2, (255, 212, 59), rot=-3)
badge('$44M EACH*', 540, 585, 92, (47, 184, 106), rot=-3)
outlined('*average per worker · Anthropic IPO', 540, 1840, 40, (255, 255, 255), stroke=8)
im.save(out, quality=92)
print(out)
