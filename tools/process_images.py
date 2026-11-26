"""One-off script: turns the lookbook captures into web-ready images.

Kept in the repo so the image pipeline is reproducible. When the client supplies
original high-res files, drop them into assets/img/ with the same file names
and this script is no longer needed.
"""
import os
import sys
from PIL import Image, ImageChops, ImageDraw

SRC = sys.argv[1]  # folder holding the raw captures
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "img")


def f(key):
    for n in os.listdir(SRC):
        if key in n:
            return os.path.join(SRC, n)
    raise FileNotFoundError(key)


PRODUCTS = {
    "wishbone": "7g0ni9", "napoleon": "s0cd6v", "bistro-white": "e4h0qs",
    "bentwood-light": "izoz4j", "folding-chair": "rxhsr6", "arizona": "odkoys",
    "willow-light": "faaz66", "minnie": "kvsh0h", "ambrose": "j5f4ex",
    "portia": "gnb7u2", "round-rattan": "938wto", "willow-dark": "rg6qjv",
    "wicker": "5fnu59", "carpathia": "t24j7r", "bentwood-black": "kho86k",
    "quinn": "kbixa6", "bistro-black": "ibfky6", "carmel": "0qmpab",
    "cane": "b8dmwz", "lindsay": "dg4cct",
    "burl-rectangle": "7ydzv2", "madeline": "h7s7p5", "travertine": "2yxb72",
    "burl-round": "r2dnjt", "anthro": "5xf88e", "barra": "kz0nki",
    "holly": "pplthf", "ribbed": "tg1i0w", "fluted": "ld3lzb",
    "chandelier-8ft-ivory": "fife6p", "chandelier-4ft-ivory": "n4il8h",
    "chandelier-4ft-mocha": "v9tza9",
    "facade-trellis-blue": "maq1bk", "facade-skirt-stripes": "65lz9l",
    "facade-panel-dark": "ypnmea", "facade-rustic-light": "i1qe4d",
    "facade-traditional-white": "twc4z7", "facade-cane-green": "brvtjs",
    "facade-ribbed-pink": "vla275", "facade-marble-black": "t2k2hs",
    "stage-round-8ft": "wnphxz", "stage-8x12": "nqp07l",
    "dance-floor": "603ff8", "acrylic-bar": "eceedu",
    "folding-8ft": "arrwiq", "folding-8ft-king": "idw1xc", "folding-48-round": "2xnb3v",
    "folding-60-round": "ftuhs9", "folding-72-round": "cax1da",
    "folding-serpentine": "sbxm2f", "folding-6ft": "arrwiq",
}

# White-out patches for vendor UI artifacts baked into some source images
PATCHES = {
    "folding-8ft": [(30, 255, 80, 320), (725, 255, 775, 320)],
    "folding-6ft": [(30, 255, 80, 320), (725, 255, 775, 320)],
    "folding-8ft-king": [(0, 0, 800, 98), (0, 545, 800, 600), (0, 0, 78, 600), (722, 0, 800, 600)],
    "folding-60-round": [(100, 235, 150, 290), (650, 235, 700, 290), (60, 0, 80, 600)],
    "folding-72-round": [(75, 300, 125, 360), (685, 300, 735, 360), (0, 0, 70, 600), (740, 0, 800, 600), (0, 560, 800, 600)],
    "wicker": [(190, 555, 240, 600)],
    "bentwood-light": [(0, 0, 800, 16)],
}


def trim(im, thresh=14):
    bg = Image.new("RGB", im.size, (255, 255, 255))
    diff = ImageChops.difference(im, bg).convert("L").point(lambda p: 255 if p > thresh else 0)
    box = diff.getbbox()
    return im.crop(box) if box else im


def square_pad(im, size=900, margin=0.08):
    w, h = im.size
    scale = min(size * (1 - 2 * margin) / w, size * (1 - 2 * margin) / h)
    im = im.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    canvas = Image.new("RGB", (size, size), (255, 255, 255))
    canvas.paste(im, ((size - im.width) // 2, (size - im.height) // 2))
    return canvas


def products():
    out = os.path.join(OUT, "products")
    os.makedirs(out, exist_ok=True)
    for slug, key in PRODUCTS.items():
        im = Image.open(f(key)).convert("RGB")
        d = ImageDraw.Draw(im)
        for r in PATCHES.get(slug, []):
            d.rectangle(r, fill=(255, 255, 255))
        im = square_pad(trim(im))
        im.save(os.path.join(out, slug + ".webp"), quality=82, method=6)


def stitch_v(keys_offsets, total_h, w=800):
    canvas = Image.new("RGB", (w, total_h))
    for key, y in keys_offsets:
        canvas.paste(Image.open(f(key)).convert("RGB"), (0, y))
    return canvas


def stitch_grid(tiles, size):
    canvas = Image.new("RGB", size)
    for key, (x, y) in tiles:
        canvas.paste(Image.open(f(key)).convert("RGB"), (x, y))
    return canvas


EVENTS = {
    "umbrella-aisle": (stitch_v, ([("qp73s0", 0), ("9i72c5", 600)], 1200)),
    "pink-porch": (stitch_v, ([("4ikvga", 0), ("npv1u0", 599)], 1199)),
    "overhead-rows": (stitch_v, ([("pe3w2i", 0), ("pk96y6", 466)], 1066)),
    "sunroom-cane": (stitch_v, ([("jcrmtm", 0), ("vy77j9", 599)], 1199)),
    "garden-snapdragons": (stitch_v, ([("hmif6d", 0), ("1dzmec", 475)], 1075)),
    "sculpted-wishbone": (stitch_v, ([("2mv6uk", 0), ("62myi6", 599)], 1199)),
    "lawn-iron-ceremony": (stitch_v, ([("2ic8et", 0), ("k00us5", 600)], 1200)),
    "draped-pergola": (stitch_v, ([("njuzuk", 0), ("nq6q7l", 521)], 1121)),
    "tropical-cane-bistro": (stitch_v, ([("2e1yyn", 0), ("vtzwy6", 400)], 1000)),
    "lakeside-dinner": (stitch_v, ([("vprwch", 0), ("iu3ipp", 475)], 1075)),
    "terracotta-limestone": (stitch_v, ([("jcoojv", 0), ("jjwn54", 599)], 1199)),
    "garden-arbor": (stitch_v, ([("xhzu8g", 0), ("vxadph", 475)], 1075)),
    "tablescape-above": (stitch_v, ([("y2opy4", 0), ("8hsk7m", 466)], 1066)),
    "candlelit-hall": (stitch_grid, ([("fa0qec", (0, 0)), ("2euuv4", (488, 0)), ("awvlnb", (0, 259)), ("ml51jl", (488, 259))], (1288, 859))),
    "limestone-steps": (stitch_grid, ([("r0mp13", (0, 0)), ("wtc57n", (288, 0)), ("qq7dgd", (0, 125)), ("6ardhl", (288, 125))], (1088, 725))),
}


def events():
    out = os.path.join(OUT, "events")
    os.makedirs(out, exist_ok=True)
    for name, (fn, args) in EVENTS.items():
        im = fn(*args)
        im.save(os.path.join(out, name + ".webp"), quality=84, method=6)
    single = Image.open(f("p8ou4z")).convert("RGB")
    single.save(os.path.join(out, "lawn-wishbone-ceremony.webp"), quality=84, method=6)


if __name__ == "__main__":
    products()
    events()
    print("done")
