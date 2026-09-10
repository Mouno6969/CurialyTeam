#!/usr/bin/env python3
"""
Curialy advertisement — cinematic motion graphics.
Brand: classical dark shop · Instrument type · radial dots · private crypto checkout.
"""

from __future__ import annotations

import math
import os
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
W, H = 1920, 1080
FPS = 30
DURATION = 28.0  # matches VO + short tail
N_FRAMES = int(DURATION * FPS)

FONT_DIR = ROOT / "fonts"
LOGO_PATH = REPO / "public" / "brand" / "curialy-logo.jpg"
OUT_DIR = ROOT / "frames"
OUT_MP4 = ROOT / "curialy-ad.mp4"
VO_PATH = ROOT / "voiceover.mp3"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

# Brand palette (dark classical)
BG = (9, 9, 11)
CARD = (17, 17, 20)
FG = (244, 244, 245)
MUTED = (161, 161, 170)
ACCENT = (196, 200, 208)
SILVER = (138, 142, 150)
BORDER = (40, 40, 44)
PRIMARY_BTN = (236, 236, 236)
INK = (9, 9, 11)
PAPER = (246, 243, 236)
SECONDARY = (24, 24, 28)


def load_font(name: str, size: int) -> ImageFont.FreeTypeFont:
    path = FONT_DIR / name
    try:
        return ImageFont.truetype(str(path), size=size)
    except OSError:
        fallback = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
        return ImageFont.truetype(fallback, size=size)


F_DISPLAY = lambda s: load_font("InstrumentSerif-Regular.ttf", s)
F_DISPLAY_IT = lambda s: load_font("InstrumentSerif-Italic.ttf", s)
F_SANS = lambda s: load_font("InstrumentSans-Regular.ttf", s)
F_SANS_MD = lambda s: load_font("InstrumentSans-Medium.ttf", s)
F_SANS_SB = lambda s: load_font("InstrumentSans-SemiBold.ttf", s)
F_MONO = lambda s: load_font("IBMPlexMono-Regular.ttf", s)
F_MONO_MD = lambda s: load_font("IBMPlexMono-Medium.ttf", s)


def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def ease_out_cubic(t: float) -> float:
    t = clamp01(t)
    return 1 - (1 - t) ** 3


def ease_in_out(t: float) -> float:
    t = clamp01(t)
    return 3 * t * t - 2 * t * t * t


def ease_out_expo(t: float) -> float:
    t = clamp01(t)
    return 1.0 if t == 1.0 else 1 - 2 ** (-10 * t)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def lerp_color(c1, c2, t):
    t = clamp01(t)
    return tuple(int(lerp(a, b, t)) for a, b in zip(c1, c2))


def alpha_composite(base: Image.Image, overlay: Image.Image, opacity: float = 1.0) -> Image.Image:
    if opacity <= 0:
        return base
    if overlay.mode != "RGBA":
        overlay = overlay.convert("RGBA")
    if opacity < 1.0:
        r, g, b, a = overlay.split()
        a = a.point(lambda p: int(p * opacity))
        overlay = Image.merge("RGBA", (r, g, b, a))
    out = base.convert("RGBA")
    out.alpha_composite(overlay)
    return out


def draw_text(
    draw: ImageDraw.ImageDraw,
    xy,
    text: str,
    font,
    fill=FG,
    anchor="lt",
    tracking: float = 0.0,
):
    """Simple tracking support for kickers."""
    if tracking == 0 or len(text) <= 1:
        draw.text(xy, text, font=font, fill=fill, anchor=anchor)
        return
    # manual letter spacing
    # measure each glyph
    chars = list(text)
    widths = [font.getlength(c) for c in chars]
    total = sum(widths) + tracking * (len(chars) - 1)
    x, y = xy
    if anchor in ("mm", "mt", "mb"):
        x -= total / 2
    elif anchor in ("rt", "rm", "rb"):
        x -= total
    if anchor in ("lm", "mm", "rm"):
        # vertical mid handled by per-char
        pass
    # For simplicity use left-top equivalent after shift
    # Determine vertical offset via a dummy
    bbox = font.getbbox("Ag")
    h = bbox[3] - bbox[1]
    if anchor.endswith("m") or anchor[1] == "m":
        y -= h / 2
    elif anchor.endswith("b"):
        y -= h
    cx = x
    for c, w in zip(chars, widths):
        draw.text((cx, y), c, font=font, fill=fill)
        cx += w + tracking


def rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def make_dot_field(size, spacing=14, radius=1.2, color=(196, 200, 208, 70), mask_center=None, mask_r=0):
    """Radial-masked dot field matching brand DotField."""
    w, h = size
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = img.load()
    cr, cg, cb, ca = color
    cx = mask_center[0] if mask_center else w * 0.72
    cy = mask_center[1] if mask_center else h * 0.42
    mr = mask_r or min(w, h) * 0.55
    for y in range(0, h, spacing):
        for x in range(0, w, spacing):
            d = math.hypot(x - cx, y - cy)
            fall = clamp01(1 - d / mr)
            fall = fall ** 1.4
            a = int(ca * fall)
            if a < 4:
                continue
            # draw small circle
            for dy in range(-1, 2):
                for dx in range(-1, 2):
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < w and 0 <= yy < h:
                        if dx * dx + dy * dy <= 1:
                            px[xx, yy] = (cr, cg, cb, a)
    return img


def make_radial_matrix(size=700, rings=18, spokes=48):
    """Soft radial matrix graphic."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx = cy = size // 2
    for i in range(1, rings + 1):
        r = int(size * 0.08 + i * (size * 0.4 / rings))
        a = int(28 + 18 * math.sin(i * 0.4))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(196, 200, 208, a), width=1)
    for s in range(spokes):
        ang = (s / spokes) * math.pi * 2
        x2 = cx + math.cos(ang) * size * 0.48
        y2 = cy + math.sin(ang) * size * 0.48
        a = 18 if s % 4 else 32
        draw.line([cx, cy, x2, y2], fill=(196, 200, 208, a), width=1)
    # soft blur
    img = img.filter(ImageFilter.GaussianBlur(radius=0.6))
    return img


def load_logo(size: int) -> Image.Image:
    logo = Image.open(LOGO_PATH).convert("RGBA")
    logo = logo.resize((size, size), Image.Resampling.LANCZOS)
    # circular mask
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size - 1, size - 1], fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(logo, (0, 0), mask)
    # subtle ring
    ring = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(ring)
    d.ellipse([1, 1, size - 2, size - 2], outline=(244, 244, 245, 28), width=2)
    out = Image.alpha_composite(out, ring)
    return out


# Precompute static assets
print("Precomputing assets…")
DOT_FIELD = make_dot_field((W, H), spacing=12, color=(196, 200, 208, 55))
DOT_FIELD_SMALL = make_dot_field((W, H), spacing=16, color=(196, 200, 208, 40), mask_center=(W / 2, H * 0.35), mask_r=H * 0.7)
RADIAL = make_radial_matrix(780)
LOGO_LG = load_logo(280)
LOGO_MD = load_logo(120)
LOGO_SM = load_logo(72)


def vignette(img: Image.Image, strength=0.45) -> Image.Image:
    w, h = img.size
    y, x = np.ogrid[:h, :w]
    cx, cy = w / 2, h / 2
    d = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    d = d / d.max()
    v = 1 - strength * (d ** 2.2)
    v = np.clip(v, 0, 1)
    arr = np.array(img).astype(np.float32)
    arr[..., :3] *= v[..., None]
    return Image.fromarray(arr.astype(np.uint8))


def film_grain(img: Image.Image, amount=6, seed=0) -> Image.Image:
    rng = np.random.default_rng(seed)
    arr = np.array(img).astype(np.int16)
    noise = rng.integers(-amount, amount + 1, size=arr.shape[:2], dtype=np.int16)
    arr[..., :3] = np.clip(arr[..., :3] + noise[..., None], 0, 255)
    return Image.fromarray(arr.astype(np.uint8))


# ─── Scene builders ───────────────────────────────────────────────────────────

def scene_open(t: float) -> Image.Image:
    """0–3.2s: logo emerges from dark with radial breathe."""
    img = Image.new("RGBA", (W, H), BG + (255,))
    img = alpha_composite(img, DOT_FIELD_SMALL, 0.55 + 0.15 * math.sin(t * 1.2))

    # rotating radial behind logo
    rot = (t * 8) % 360
    rad = RADIAL.rotate(rot, resample=Image.Resampling.BICUBIC, expand=False)
    rx, ry = W // 2 - rad.width // 2, H // 2 - rad.height // 2 - 40
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    layer.paste(rad, (rx, ry), rad)
    img = alpha_composite(img, layer, 0.35 + 0.25 * ease_out_cubic(t / 2.5))

    # logo scale + fade
    appear = ease_out_cubic((t - 0.15) / 1.1)
    scale = lerp(0.82, 1.0, appear)
    blur_amt = lerp(8, 0, appear)
    logo = LOGO_LG
    sz = int(280 * scale)
    logo_s = logo.resize((sz, sz), Image.Resampling.LANCZOS)
    if blur_amt > 0.5:
        logo_s = logo_s.filter(ImageFilter.GaussianBlur(radius=blur_amt))
    lx = W // 2 - sz // 2
    ly = H // 2 - sz // 2 - 70
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    layer.paste(logo_s, (lx, ly), logo_s)
    img = alpha_composite(img, layer, appear)

    # wordmark
    draw = ImageDraw.Draw(img)
    word_a = ease_out_cubic((t - 1.0) / 0.9)
    if word_a > 0:
        f = F_DISPLAY(92)
        # fade by drawing on temp
        tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        td = ImageDraw.Draw(tmp)
        td.text((W // 2, H // 2 + 200), "Curialy", font=f, fill=FG + (int(255 * word_a),), anchor="mm")
        img = Image.alpha_composite(img, tmp)

    # kicker
    kick_a = ease_out_cubic((t - 1.6) / 0.8)
    if kick_a > 0:
        tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        td = ImageDraw.Draw(tmp)
        f = F_MONO(18)
        text = "A CONSIDERED DIGITAL SHOP"
        # letter-spacing
        total = sum(f.getlength(c) for c in text) + 6 * (len(text) - 1)
        x = W // 2 - total / 2
        y = H // 2 + 270
        col = MUTED + (int(230 * kick_a),)
        cx = x
        for c in text:
            td.text((cx, y), c, font=f, fill=col)
            cx += f.getlength(c) + 6
        # rule lines
        rl = int(60 * kick_a)
        td.line([(W // 2 - total / 2 - 30 - rl, y + 10), (W // 2 - total / 2 - 20, y + 10)], fill=BORDER + (int(200 * kick_a),), width=1)
        td.line([(W // 2 + total / 2 + 20, y + 10), (W // 2 + total / 2 + 30 + rl, y + 10)], fill=BORDER + (int(200 * kick_a),), width=1)
        img = Image.alpha_composite(img, tmp)

    return img


def scene_promise(t: float) -> Image.Image:
    """3.0–7.2s: hero line + typewriter phrases."""
    img = Image.new("RGBA", (W, H), BG + (255,))
    img = alpha_composite(img, DOT_FIELD, 0.7)

    # radial right
    rot = (t * 6) % 360
    rad = RADIAL.rotate(rot, resample=Image.Resampling.BICUBIC)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    layer.paste(rad, (W - 520, -80), rad)
    img = alpha_composite(img, layer, 0.4)

    appear = ease_out_cubic(t / 0.7)
    tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)

    # kicker
    f_k = F_MONO(16)
    kicker = "THE PROMISE"
    kx = 160
    ky = 260
    col = MUTED + (int(255 * appear),)
    cx = kx
    for c in kicker:
        td.text((cx, ky), c, font=f_k, fill=col)
        cx += f_k.getlength(c) + (5 if c != " " else 10)
    td.line([(kx, ky + 36), (kx + int(80 * appear), ky + 36)], fill=BORDER + (int(255 * appear),), width=1)

    # main headline
    y_off = int(lerp(24, 0, appear))
    f_h = F_DISPLAY(110)
    td.text((160, 320 + y_off), "Subscriptions,", font=f_h, fill=FG + (int(255 * appear),))

    # rotating type lines
    lines = ["made simple.", "priced clearly.", "paid privately."]
    # cycle every ~1.3s
    cycle = 1.35
    idx = int(t / cycle) % len(lines)
    local = (t % cycle) / cycle
    if local < 0.15:
        typed_n = int(len(lines[idx]) * (local / 0.15))
    elif local < 0.75:
        typed_n = len(lines[idx])
    else:
        typed_n = int(len(lines[idx]) * (1 - (local - 0.75) / 0.25))
    typed = lines[idx][: max(0, typed_n)]
    f_it = F_DISPLAY_IT(110)
    caret_on = int(t * 2) % 2 == 0
    line = typed + ("|" if caret_on and local < 0.75 else "")
    td.text((160, 440 + y_off), line, font=f_it, fill=MUTED + (int(255 * appear),))

    # subcopy
    sub_a = ease_out_cubic((t - 0.8) / 0.7)
    if sub_a > 0:
        f_s = F_SANS(28)
        copy = "Clear plans. Honest prices. Private payment."
        td.text((160, 620), copy, font=f_s, fill=MUTED + (int(240 * sub_a),))

    # small logo top-left
    logo_a = ease_out_cubic((t - 0.2) / 0.5)
    layer2 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    layer2.paste(LOGO_SM, (160, 80), LOGO_SM)
    td2 = ImageDraw.Draw(layer2)
    td2.text((250, 100), "Curialy", font=F_DISPLAY(36), fill=FG + (int(255 * logo_a),))
    img = alpha_composite(img, layer2, logo_a)
    img = Image.alpha_composite(img, tmp)
    return img


def scene_steps(t: float) -> Image.Image:
    """7.0–12.5s: three-step flow."""
    img = Image.new("RGBA", (W, H), BG + (255,))
    img = alpha_composite(img, DOT_FIELD_SMALL, 0.5)

    tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)

    head_a = ease_out_cubic(t / 0.6)
    f_k = F_MONO(16)
    kicker = "HOW IT WORKS"
    cx = W // 2 - (sum(f_k.getlength(c) for c in kicker) + 5 * (len(kicker) - 1)) / 2
    x = cx
    for c in kicker:
        td.text((x, 140), c, font=f_k, fill=MUTED + (int(255 * head_a),))
        x += f_k.getlength(c) + 5
    td.text((W // 2, 190), "Three steps. Nothing hidden.", font=F_DISPLAY(64), fill=FG + (int(255 * head_a),), anchor="mt")

    steps = [
        ("01", "Choose a plan", "Review duration, price,\nand availability."),
        ("02", "Confirm delivery", "Share only what matters\n— like your X handle."),
        ("03", "Pay privately", "Network, coin, exact amount.\nThen keep your receipt."),
    ]
    card_w, card_h = 420, 420
    gap = 48
    total_w = 3 * card_w + 2 * gap
    start_x = (W - total_w) // 2
    base_y = 320

    for i, (n, title, copy) in enumerate(steps):
        delay = 0.35 + i * 0.35
        a = ease_out_cubic((t - delay) / 0.65)
        if a <= 0:
            continue
        y = base_y + int(lerp(40, 0, a))
        x = start_x + i * (card_w + gap)
        # card
        card = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
        cd = ImageDraw.Draw(card)
        cd.rounded_rectangle([0, 0, card_w - 1, card_h - 1], radius=24, fill=CARD + (int(250 * a),), outline=(255, 255, 255, int(22 * a)), width=1)
        # number circle
        cd.ellipse([32, 36, 84, 88], fill=SECONDARY + (int(255 * a),))
        cd.text((58, 62), n, font=F_MONO_MD(16), fill=MUTED + (int(255 * a),), anchor="mm")
        cd.text((32, 130), title, font=F_DISPLAY(42), fill=FG + (int(255 * a),))
        # rule
        cd.line([(32, 200), (32 + int(60 * a), 200)], fill=BORDER + (int(255 * a),), width=1)
        for li, line in enumerate(copy.split("\n")):
            cd.text((32, 230 + li * 36), line, font=F_SANS(22), fill=MUTED + (int(240 * a),))
        # check on last
        if i == 2 and a > 0.7:
            cd.ellipse([card_w - 72, card_h - 72, card_w - 32, card_h - 32], outline=ACCENT + (int(180 * a),), width=2)
            cd.line([(card_w - 60, card_h - 52), (card_w - 52, card_h - 44), (card_w - 42, card_h - 60)], fill=FG + (int(255 * a),), width=3)
        tmp.paste(card, (x, y), card)

        # connector line between cards
        if i < 2:
            ca = ease_out_cubic((t - delay - 0.3) / 0.5)
            if ca > 0:
                x1 = x + card_w + 8
                x2 = x1 + gap - 16
                midy = base_y + card_h // 2
                td.line([(x1, midy), (x1 + int((x2 - x1) * ca), midy)], fill=BORDER + (int(200 * ca),), width=1)

    img = Image.alpha_composite(img, tmp)
    return img


def scene_products(t: float) -> Image.Image:
    """12.2–18.0s: product cards X Premium + Google AI."""
    img = Image.new("RGBA", (W, H), BG + (255,))
    img = alpha_composite(img, DOT_FIELD, 0.55)

    tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)

    head_a = ease_out_cubic(t / 0.55)
    f_k = F_MONO(16)
    kicker = "THE SHOP"
    cx0 = 160
    x = cx0
    for c in kicker:
        td.text((x, 120), c, font=f_k, fill=MUTED + (int(255 * head_a),))
        x += f_k.getlength(c) + 5
    td.text((160, 165), "Choose your plan.", font=F_DISPLAY(72), fill=FG + (int(255 * head_a),))

    products = [
        {
            "name": "X Premium",
            "cat": "SOCIAL PLAN",
            "desc": "Premium social features,\nduration set before you pay.",
            "plans": [("3 months", "$3", "$4"), ("6 months", "$6", "$8")],
            "mark": "x",
            "available": True,
        },
        {
            "name": "Google AI",
            "cat": "AI PLAN",
            "desc": "Flexible access periods\nfor AI tools you already use.",
            "plans": [("1 mo", "$10", None), ("3 mo", "$27", None), ("6 mo", "$50", None), ("12 mo", "$96", None)],
            "mark": "ai",
            "available": False,
        },
    ]

    card_w, card_h = 760, 560
    for i, p in enumerate(products):
        delay = 0.35 + i * 0.4
        a = ease_out_cubic((t - delay) / 0.7)
        if a <= 0:
            continue
        x = 160 + i * (card_w + 40)
        y = 280 + int(lerp(36, 0, a))
        card = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
        cd = ImageDraw.Draw(card)
        cd.rounded_rectangle([0, 0, card_w - 1, card_h - 1], radius=28, fill=CARD + (int(252 * a),), outline=(255, 255, 255, int(24 * a)), width=1)

        # mark
        if p["mark"] == "x":
            # Official-style X logomark drawn as polygons
            ox, oy = 56, 56
            s = 1.15
            # thick X from two parallelograms (Twitter/X mark silhouette)
            def poly(pts, fill):
                cd.polygon([(ox + x * s, oy + y * s) for x, y in pts], fill=fill)
            col = FG + (int(255 * a),)
            # outer X silhouette approximating the official mark
            poly([(0, 4), (14, 4), (28, 22), (42, 4), (56, 4), (34, 30), (56, 56), (42, 56), (28, 38), (14, 56), (0, 56), (22, 30)], col)
        else:
            # Google AI spark (4-point star + satellite), matching product mark
            def spark(cx, cy, r, fill):
                # wide 4-point diamond like the official Gemini spark
                star = [
                    (cx, cy - r),
                    (cx + r * 0.42, cy - r * 0.08),
                    (cx + r * 0.55, cy),
                    (cx + r * 0.42, cy + r * 0.08),
                    (cx, cy + r),
                    (cx - r * 0.42, cy + r * 0.08),
                    (cx - r * 0.55, cy),
                    (cx - r * 0.42, cy - r * 0.08),
                ]
                cd.polygon(star, fill=fill)
            aa = int(255 * a)
            spark(82, 78, 36, (66, 133, 244, aa))
            # warm overlay on lower tip via smaller clipped feel
            spark(82, 90, 18, (155, 114, 203, int(160 * a)))
            spark(82, 100, 10, (217, 101, 112, int(180 * a)))
            spark(124, 108, 16, (239, 108, 63, aa))
            spark(124, 108, 16, (217, 101, 112, int(100 * a)))

        # availability badge
        badge = "AVAILABLE" if p["available"] else "COMING SOON"
        bw = 140 if p["available"] else 150
        bx = card_w - bw - 40
        cd.rounded_rectangle([bx, 48, bx + bw, 84], radius=20, fill=SECONDARY + (int(255 * a),))
        cd.text((bx + bw / 2, 66), badge, font=F_MONO(12), fill=MUTED + (int(255 * a),), anchor="mm")

        cd.text((48, 140), p["cat"], font=F_MONO(14), fill=MUTED + (int(255 * a),))
        # tracking for cat
        cd.text((48, 175), p["name"], font=F_DISPLAY(56), fill=FG + (int(255 * a),))
        for li, line in enumerate(p["desc"].split("\n")):
            cd.text((48, 260 + li * 32), line, font=F_SANS(22), fill=MUTED + (int(235 * a),))

        # plan chips
        px0, py0 = 48, 360
        for j, (label, price, compare) in enumerate(p["plans"]):
            chip_w = 150 if len(p["plans"]) > 2 else 200
            chip_h = 96
            if len(p["plans"]) <= 2:
                cxp = px0 + j * (chip_w + 16)
                cyp = py0
            else:
                cxp = px0 + (j % 4) * (chip_w + 12)
                cyp = py0
            selected = j == 0 and p["available"]
            fill = PRIMARY_BTN + (int(255 * a),) if selected else SECONDARY + (int(255 * a),)
            tcol = INK + (int(255 * a),) if selected else FG + (int(255 * a),)
            mcol = (80, 80, 86, int(255 * a)) if selected else MUTED + (int(255 * a),)
            cd.rounded_rectangle([cxp, cyp, cxp + chip_w, cyp + chip_h], radius=14, fill=fill)
            cd.text((cxp + 16, cyp + 18), label, font=F_SANS(16), fill=mcol)
            cd.text((cxp + 16, cyp + 48), price, font=F_SANS_SB(28), fill=tcol)
            if compare:
                # strikethrough
                sw = F_SANS(16).getlength(compare)
                cd.text((cxp + 90, cyp + 56), compare, font=F_SANS(16), fill=mcol)
                cd.line([(cxp + 90, cyp + 66), (cxp + 90 + sw, cyp + 66)], fill=mcol, width=1)

        tmp.paste(card, (x, y), card)

    img = Image.alpha_composite(img, tmp)
    return img


def scene_trust(t: float) -> Image.Image:
    """17.6–22.8s: receipt + refund + private pay."""
    img = Image.new("RGBA", (W, H), BG + (255,))
    img = alpha_composite(img, DOT_FIELD_SMALL, 0.45)

    tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)

    head_a = ease_out_cubic(t / 0.5)
    td.text((160, 140), "TRUST, BUILT IN", font=F_MONO(16), fill=MUTED + (int(255 * head_a),))
    # fix tracking roughly by redrawing
    tmp2 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    t2 = ImageDraw.Draw(tmp2)
    f_k = F_MONO(16)
    text = "TRUST, BUILT IN"
    x = 160
    for c in text:
        t2.text((x, 140), c, font=f_k, fill=MUTED + (int(255 * head_a),))
        x += f_k.getlength(c) + 5
    t2.text((160, 185), "Every order tracked.\nEvery receipt yours.", font=F_DISPLAY(64), fill=FG + (int(255 * head_a),))
    img = Image.alpha_composite(img, tmp2)

    # parchment receipt card
    a = ease_out_cubic((t - 0.4) / 0.7)
    if a > 0:
        rw, rh = 520, 640
        receipt = Image.new("RGBA", (rw, rh), (0, 0, 0, 0))
        rd = ImageDraw.Draw(receipt)
        # paper body
        rd.rounded_rectangle([0, 0, rw - 1, rh - 1], radius=8, fill=PAPER + (int(255 * a),))
        # header bar
        rd.rectangle([0, 0, rw, 90], fill=(232, 226, 214, int(255 * a)))
        rd.text((rw // 2, 36), "CURIALY", font=F_DISPLAY(28), fill=INK + (int(255 * a),), anchor="mt")
        rd.text((rw // 2, 68), "ORDER RECEIPT", font=F_MONO(12), fill=(90, 90, 96, int(255 * a)), anchor="mt")

        # order code
        rd.text((40, 120), "ORDER", font=F_MONO(12), fill=(110, 110, 118, int(255 * a)))
        code = "CLY-7K3M2QX9"
        # typewriter effect on code
        n = int(len(code) * clamp01((t - 0.8) / 1.0))
        rd.text((40, 145), code[:n], font=F_SANS_SB(32), fill=INK + (int(255 * a),))

        rows = [
            ("Product", "X Premium · 3 months"),
            ("Network", "Solana"),
            ("Coin", "USDC"),
            ("Amount", "$3.00"),
            ("Status", "Completed"),
        ]
        for i, (k, v) in enumerate(rows):
            ra = ease_out_cubic((t - 1.2 - i * 0.15) / 0.4)
            if ra <= 0:
                continue
            yy = 220 + i * 52
            rd.text((40, yy), k, font=F_SANS(18), fill=(110, 110, 118, int(255 * ra * a)))
            rd.text((rw - 40, yy), v, font=F_SANS_MD(18), fill=INK + (int(255 * ra * a),), anchor="rt")
            rd.line([(40, yy + 36), (rw - 40, yy + 36)], fill=(200, 194, 182, int(120 * ra * a)), width=1)

        # fake barcode
        ba = ease_out_cubic((t - 2.0) / 0.5)
        if ba > 0:
            bx, by = 40, 520
            rng = np.random.default_rng(42)
            for i in range(80):
                bw = 2 if rng.random() > 0.4 else 4
                rd.rectangle([bx, by, bx + bw, by + 50], fill=INK + (int(230 * ba * a),))
                bx += bw + 2
            rd.text((rw // 2, 585), code, font=F_MONO(14), fill=INK + (int(200 * ba * a),), anchor="mt")

        # place with slight rotate
        ang = lerp(-4, -2, a)
        receipt_r = receipt.rotate(ang, resample=Image.Resampling.BICUBIC, expand=True)
        rx = W - receipt_r.width - 120
        ry = 160 + int(lerp(30, 0, a))
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        layer.paste(receipt_r, (rx, ry), receipt_r)
        # soft shadow
        shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow)
        sd.rounded_rectangle([rx + 20, ry + 30, rx + rw - 20, ry + rh], radius=12, fill=(0, 0, 0, int(80 * a)))
        shadow = shadow.filter(ImageFilter.GaussianBlur(24))
        img = Image.alpha_composite(img, shadow)
        img = Image.alpha_composite(img, layer)

    # trust bullets left
    bullets = [
        ("Private checkout", "Pay with USDC or USDT on the network you choose."),
        ("Live order tracking", "Follow status from pending to completed."),
        ("Refund guarantee", "If a paid order never arrives, it is refunded."),
    ]
    for i, (title, copy) in enumerate(bullets):
        ba = ease_out_cubic((t - 0.6 - i * 0.25) / 0.55)
        if ba <= 0:
            continue
        by = 420 + i * 110 + int(lerp(20, 0, ba))
        bullet = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        bd = ImageDraw.Draw(bullet)
        bd.ellipse([160, by, 184, by + 24], outline=ACCENT + (int(200 * ba),), width=2)
        bd.ellipse([167, by + 7, 177, by + 17], fill=FG + (int(255 * ba),))
        bd.text((210, by - 4), title, font=F_SANS_SB(26), fill=FG + (int(255 * ba),))
        bd.text((210, by + 36), copy, font=F_SANS(20), fill=MUTED + (int(230 * ba),))
        img = Image.alpha_composite(img, bullet)

    return img


def scene_cta(t: float) -> Image.Image:
    """22.4–28s: final brand lockup + CTA."""
    img = Image.new("RGBA", (W, H), BG + (255,))
    img = alpha_composite(img, DOT_FIELD_SMALL, 0.6 + 0.1 * math.sin(t))

    rot = (t * 10) % 360
    rad = RADIAL.rotate(rot, resample=Image.Resampling.BICUBIC)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    layer.paste(rad, (W // 2 - rad.width // 2, H // 2 - rad.height // 2 - 60), rad)
    img = alpha_composite(img, layer, 0.45)

    appear = ease_out_cubic(t / 0.8)
    scale = lerp(0.9, 1.0, appear)
    sz = int(220 * scale)
    logo = LOGO_LG.resize((sz, sz), Image.Resampling.LANCZOS)
    lx = W // 2 - sz // 2
    ly = H // 2 - sz // 2 - 140
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    layer.paste(logo, (lx, ly), logo)
    img = alpha_composite(img, layer, appear)

    tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)

    wa = ease_out_cubic((t - 0.35) / 0.7)
    td.text((W // 2, H // 2 + 40), "Curialy", font=F_DISPLAY(96), fill=FG + (int(255 * wa),), anchor="mm")

    tag_a = ease_out_cubic((t - 0.8) / 0.7)
    if tag_a > 0:
        tag = "Priced clearly.  Paid privately."
        td.text((W // 2, H // 2 + 130), tag, font=F_DISPLAY_IT(36), fill=MUTED + (int(255 * tag_a),), anchor="mm")

    # CTA pill
    cta_a = ease_out_cubic((t - 1.3) / 0.6)
    if cta_a > 0:
        label = "Explore plans"
        f = F_SANS_SB(24)
        tw = f.getlength(label) + 64
        th = 64
        cx, cy = W // 2, H // 2 + 230
        td.rounded_rectangle(
            [cx - tw / 2, cy - th / 2, cx + tw / 2, cy + th / 2],
            radius=32,
            fill=PRIMARY_BTN + (int(255 * cta_a),),
        )
        td.text((cx, cy), label, font=f, fill=INK + (int(255 * cta_a),), anchor="mm")

    # bottom mono url-ish
    foot_a = ease_out_cubic((t - 1.8) / 0.5)
    if foot_a > 0:
        f = F_MONO(14)
        text = "GUEST CHECKOUT  ·  CRYPTO  ·  HUMAN SUPPORT"
        total = sum(f.getlength(c) for c in text) + 4 * (len(text) - 1)
        x = W // 2 - total / 2
        y = H - 100
        for c in text:
            td.text((x, y), c, font=f, fill=MUTED + (int(200 * foot_a),))
            x += f.getlength(c) + 4

    img = Image.alpha_composite(img, tmp)

    # fade to black at end
    if t > 4.8:
        fade = clamp01((t - 4.8) / 0.6)
        black = Image.new("RGBA", (W, H), (0, 0, 0, int(255 * fade)))
        img = Image.alpha_composite(img, black)

    return img


# ─── Timeline ────────────────────────────────────────────────────────────────

# Scene windows (start, end, builder) with crossfade overlap
SCENES = [
    (0.0, 3.3, scene_open),
    (3.0, 7.4, scene_promise),
    (7.0, 12.7, scene_steps),
    (12.3, 18.2, scene_products),
    (17.7, 23.0, scene_trust),
    (22.5, 28.0, scene_cta),
]


def render_frame(global_t: float) -> Image.Image:
    # find active scenes and crossfade
    active = []
    for start, end, fn in SCENES:
        if start - 0.05 <= global_t <= end + 0.05:
            local = global_t - start
            # edge fades
            fade_in = clamp01((global_t - start) / 0.35)
            fade_out = clamp01((end - global_t) / 0.35)
            weight = min(fade_in, fade_out)
            if weight > 0.01 or (start <= global_t <= end):
                weight = max(weight, 0.01) if start <= global_t <= end else weight
                active.append((weight, fn(local)))

    if not active:
        return Image.new("RGB", (W, H), BG)

    # sort by weight
    active.sort(key=lambda x: x[0])
    base = Image.new("RGBA", (W, H), BG + (255,))
    # if single scene
    if len(active) == 1:
        w, fr = active[0]
        base = fr if fr.mode == "RGBA" else fr.convert("RGBA")
    else:
        # composite lower weight first, then higher
        for w, fr in active:
            fr = fr if fr.mode == "RGBA" else fr.convert("RGBA")
            base = alpha_composite(base, fr, clamp01(w * 1.2))

    # post
    rgb = base.convert("RGB")
    rgb = vignette(rgb, strength=0.38)
    frame_i = int(global_t * FPS)
    rgb = film_grain(rgb, amount=5, seed=frame_i * 997)
    return rgb


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Rendering {N_FRAMES} frames @ {FPS}fps ({DURATION}s)…")

    # Render frames in batches and pipe to ffmpeg for efficiency
    # We'll write frames as PNG then encode — for 28s*30=840 frames this is OK.

    # Use ffmpeg pipe for speed
    cmd = [
        FFMPEG,
        "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-pix_fmt", "rgb24",
        "-s", f"{W}x{H}",
        "-r", str(FPS),
        "-i", "-",
        "-i", str(VO_PATH),
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "160k",
        "-ar", "48000",
        "-shortest",
        "-movflags", "+faststart",
        str(OUT_MP4),
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    assert proc.stdin is not None

    try:
        for i in range(N_FRAMES):
            t = i / FPS
            frame = render_frame(t)
            proc.stdin.write(frame.tobytes())
            if i % 30 == 0:
                print(f"  {i}/{N_FRAMES} ({100 * i / N_FRAMES:.0f}%)  t={t:.1f}s")
                sys.stdout.flush()
        proc.stdin.close()
        stderr = proc.stderr.read().decode("utf-8", errors="replace") if proc.stderr else ""
        rc = proc.wait()
        if rc != 0:
            print(stderr[-3000:])
            raise SystemExit(f"ffmpeg failed: {rc}")
    except BrokenPipeError:
        stderr = proc.stderr.read().decode("utf-8", errors="replace") if proc.stderr else ""
        print(stderr[-3000:])
        raise

    print(f"\nWrote {OUT_MP4}")
    print(f"Size: {OUT_MP4.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
