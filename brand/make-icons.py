"""Builds every app icon and in-app logo from the two source PNGs in this folder.
Run from the project root:  python brand/make-icons.py   (needs Pillow + numpy)"""
from PIL import Image
import numpy as np

BG = (1, 9, 30)  # background colour of the source logos (#01091E)

def bbox(im, thr=90):
    a = np.asarray(im.convert('RGB')).astype(int)
    ys, xs = np.where(a.max(axis=2) > thr)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

def key_transparent(im, lo=45, hi=110):
    """Dark background -> transparent, with clean anti-aliased edges."""
    a = np.asarray(im.convert('RGB')).astype(float)
    alpha = np.clip((a.max(axis=2) - lo) / (hi - lo), 0, 1)
    bg = np.array(BG, float)
    safe = np.maximum(alpha, 1e-3)[..., None]
    rgb = np.clip((a - bg * (1 - safe)) / safe, 0, 255)
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

def tile(sym, size, frac, pad_bg=BG):
    """Square tile with the symbol centred, `frac` = symbol width / tile width."""
    canvas = Image.new('RGB', (size, size), pad_bg)
    w = int(size * frac)
    h = int(sym.height * w / sym.width)
    canvas.paste(sym.resize((w, h), Image.LANCZOS), ((size - w) // 2, (size - h) // 2))
    return canvas

mark = Image.open('brand/logo-mark-src.png').convert('RGB')
x0, y0, x1, y1 = bbox(mark)
sym = mark.crop((x0, y0, x1, y1))

tile(sym, 192, 0.80).save('public/icons/icon-192.png')
tile(sym, 512, 0.80).save('public/icons/icon-512.png')
tile(sym, 512, 0.56).save('public/icons/icon-maskable-512.png')   # keeps the symbol inside the safe circle
tile(sym, 180, 0.80).save('public/icons/apple-touch-icon.png')
t48 = tile(sym, 48, 0.92); t48.save('public/icons/favicon-48.png')
tile(sym, 32, 0.94).save('public/icons/favicon-32.png')
t48.save('public/favicon.ico', sizes=[(48, 48), (32, 32), (16, 16)])

pad = 10
m = key_transparent(mark.crop((x0 - pad, y0 - pad, x1 + pad, y1 + pad)))
m.thumbnail((600, 600), Image.LANCZOS); m.save('public/logo-mark.png')

full = Image.open('brand/logo-full-src.png').convert('RGB')
fx0, fy0, fx1, fy1 = bbox(full)
f = key_transparent(full.crop((fx0 - pad, fy0 - pad, fx1 + pad, fy1 + pad)))
f.thumbnail((800, 800), Image.LANCZOS); f.save('public/logo-full.png')
print('ok', m.size, f.size)
