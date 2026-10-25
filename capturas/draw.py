"""Dibuja fotos de ejemplo genéricas (sin marcas) para las publicaciones de la demo."""
import random, sys
from PIL import Image, ImageDraw, ImageFilter

OUT = sys.argv[1]
W, H = 640, 480


def desk(seed, base=(196, 164, 128)):
    r = random.Random(seed)
    im = Image.new("RGB", (W, H), base)
    d = ImageDraw.Draw(im)
    for y in range(0, H, 3):  # vetas de madera
        c = tuple(max(0, min(255, v + r.randint(-10, 10))) for v in base)
        d.line([(0, y), (W, y + r.randint(-4, 4))], fill=c, width=2)
    return im.filter(ImageFilter.GaussianBlur(1.2))


def shadow(im, box, rad=26, off=(10, 14)):
    sh = Image.new("L", im.size, 0)
    ImageDraw.Draw(sh).rounded_rectangle([box[0] + off[0], box[1] + off[1], box[2] + off[0], box[3] + off[1]], rad, fill=120)
    sh = sh.filter(ImageFilter.GaussianBlur(14))
    im.paste((40, 30, 20), (0, 0), sh)


def calc_front(im, x, y, w, h, wear=False):
    d = ImageDraw.Draw(im)
    shadow(im, (x, y, x + w, y + h))
    d.rounded_rectangle([x, y, x + w, y + h], 28, fill=(38, 40, 46))
    d.rounded_rectangle([x + 8, y + 8, x + w - 8, y + h - 8], 24, outline=(70, 72, 80), width=2)
    # pantalla
    sx, sy, sw, sh_ = x + 26, y + 34, w - 52, int(h * 0.2)
    d.rounded_rectangle([sx - 6, sy - 6, sx + sw + 6, sy + sh_ + 6], 10, fill=(24, 25, 28))
    d.rectangle([sx, sy, sx + sw, sy + sh_], fill=(178, 190, 170))
    for i in range(6):  # dígitos simulados
        cx = sx + sw - 22 - i * 22
        d.rectangle([cx, sy + sh_ - 34, cx + 12, sy + sh_ - 12], fill=(60, 66, 58))
    d.rectangle([sx + 10, sy + 10, sx + 70, sy + 18], fill=(90, 98, 88))
    # teclas
    top = sy + sh_ + 30
    cols, rows = 6, 4
    kw = (w - 60) / cols
    for r_ in range(rows):  # teclas de funciones
        for c in range(cols):
            kx = x + 30 + c * kw
            ky = top + r_ * 30
            d.rounded_rectangle([kx + 4, ky, kx + kw - 4, ky + 18], 8, fill=(70, 72, 80))
    top2 = top + rows * 30 + 14
    cols2, rows2 = 5, 4
    kw2 = (w - 60) / cols2
    for r_ in range(rows2):
        for c in range(cols2):
            kx = x + 30 + c * kw2
            ky = top2 + r_ * 38
            col = (226, 228, 232)
            if c >= 3 and r_ == 0:
                col = (196, 72, 60)
            d.rounded_rectangle([kx + 5, ky, kx + kw2 - 5, ky + 26], 9, fill=col)
    if wear:
        r = random.Random(7)
        for _ in range(14):
            px, py = x + r.randint(20, w - 20), y + r.randint(20, h - 20)
            d.line([(px, py), (px + r.randint(-14, 14), py + r.randint(-3, 3))], fill=(110, 112, 118), width=1)


def calc_back(im, x, y, w, h):
    d = ImageDraw.Draw(im)
    shadow(im, (x, y, x + w, y + h))
    d.rounded_rectangle([x, y, x + w, y + h], 28, fill=(48, 50, 56))
    d.rounded_rectangle([x + 40, y + h - 150, x + w - 40, y + h - 40], 12, outline=(80, 82, 90), width=3)
    d.ellipse([x + w / 2 - 10, y + h - 105, x + w / 2 + 10, y + h - 85], outline=(90, 92, 100), width=3)
    d.rectangle([x + 50, y + 60, x + w - 50, y + 110], fill=(205, 205, 200))
    for i in range(4):
        d.line([(x + 60, y + 72 + i * 10), (x + w - 70 - i * 20, y + 72 + i * 10)], fill=(120, 120, 118), width=2)
    for cx in (x + 30, x + w - 30):
        for cy in (y + 30, y + h - 30):
            d.ellipse([cx - 9, cy - 9, cx + 9, cy + 9], fill=(30, 31, 35))


def notebook(im, box, color=(232, 230, 222)):
    d = ImageDraw.Draw(im)
    shadow(im, box, rad=6, off=(6, 8))
    d.rectangle(box, fill=color)
    for yy in range(box[1] + 30, box[3] - 10, 22):
        d.line([(box[0] + 10, yy), (box[2] - 10, yy)], fill=(170, 190, 215), width=1)
    d.line([(box[0] + 50, box[1]), (box[0] + 50, box[3])], fill=(220, 140, 140), width=2)


def save(im, name):
    im.save(f"{OUT}/{name}.jpg", quality=80)


# Calculadora: 4 fotos
im = desk(1); calc_front(im, 220, 30, 200, 420); save(im, "calc1")
im = desk(2); calc_back(im, 220, 30, 200, 420); save(im, "calc2")
im = desk(3, (205, 176, 140)).resize((W, H))
big = Image.new("RGB", (W, H)); big.paste(im)
calc_front(big, 90, -260, 460, 900, wear=True); save(big, "calc3")
im = desk(4); notebook(im, (60, 60, 420, 440)); calc_front(im, 360, 80, 170, 360); save(im, "calc4")

# Libros: pila de libros genéricos
def books(seed, palette):
    im = desk(seed, (210, 186, 150))
    d = ImageDraw.Draw(im)
    y = 400
    r = random.Random(seed)
    for c in palette:
        h = r.randint(42, 62); w = r.randint(330, 420); x = (W - w) // 2 + r.randint(-20, 20)
        shadow(im, (x, y - h, x + w, y), rad=4, off=(4, 6))
        d.rectangle([x, y - h, x + w, y], fill=c)
        d.rectangle([x + w - 16, y - h + 4, x + w - 4, y - 4], fill=(238, 234, 222))
        d.rectangle([x + 30, y - h / 2 - 4, x + 170, y - h / 2 + 4], fill=tuple(min(255, v + 60) for v in c))
        y -= h
    return im
save(books(11, [(107, 26, 47), (40, 70, 110), (60, 100, 70), (180, 140, 60)]), "book1")
save(books(12, [(40, 70, 110), (120, 120, 125)]), "book2")

# Escalímetro y escuadras (útiles)
im = desk(21, (190, 196, 200)); d = ImageDraw.Draw(im)
shadow(im, (80, 200, 560, 250), rad=4); d.polygon([(80, 200), (560, 200), (560, 250), (80, 250)], fill=(236, 236, 230))
for i in range(0, 470, 12):
    d.line([(90 + i, 200), (90 + i, 212 if i % 60 else 222)], fill=(40, 40, 40), width=1)
d.polygon([(120, 420), (300, 420), (120, 290)], outline=(90, 140, 170), width=6)
save(im, "util1")

# Maqueta: bloques blancos sobre base
im = desk(31, (200, 200, 196)); d = ImageDraw.Draw(im)
shadow(im, (100, 240, 540, 420), rad=4); d.rectangle([100, 240, 540, 420], fill=(150, 150, 146))
for bx, by, bw, bh in [(140, 170, 120, 200), (290, 120, 90, 250), (400, 200, 110, 170)]:
    d.rectangle([bx, by, bx + bw, by + bh], fill=(246, 246, 242), outline=(200, 200, 196), width=2)
    for wy in range(by + 16, by + bh - 10, 26):
        d.rectangle([bx + 12, wy, bx + bw - 12, wy + 10], fill=(214, 220, 226))
save(im, "maq1")

# Apuntes PDF: captura de página
im = Image.new("RGB", (W, H), (236, 238, 240)); d = ImageDraw.Draw(im)
d.rectangle([150, 20, 490, 460], fill="white", outline=(210, 210, 210))
d.rectangle([180, 50, 400, 66], fill=(60, 60, 60))
for i, yy in enumerate(range(90, 440, 18)):
    d.rectangle([180, yy, 460 - (i * 37) % 90, yy + 7], fill=(150, 150, 150))
d.rectangle([180, 250, 300, 330], outline=(107, 26, 47), width=2)
save(im, "pdf1")
print("ok")
