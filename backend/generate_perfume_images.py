from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

root = Path(r"C:\Users\USER\Desktop\CodeGrid\ecom\backend\uploads\products")
root.mkdir(parents=True, exist_ok=True)

products = [
    ("summer-oud.jpg", "SUMMER OUD"),
    ("midnight-noir.jpg", "MIDNIGHT NOIR"),
    ("amber-royale.jpg", "AMBER ROYALE"),
    ("velvet-musk.jpg", "VELVET MUSK"),
    ("royal-essence.jpg", "ROYAL ESSENCE"),
    ("ocean-elixir.jpg", "OCEAN ELIXIR"),
]

for filename, label in products:
    img = Image.new("RGB", (800, 1000), (8, 8, 12))
    draw = ImageDraw.Draw(img)

    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    for i in range(120, 0, -10):
        gdraw.rounded_rectangle((i, i, 800 - i, 1000 - i), radius=60, outline=(255, 170, 60, 12), width=2)
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    draw = ImageDraw.Draw(img)

    draw.rounded_rectangle((120, 760, 680, 910), radius=40, fill=(24, 22, 21), outline=(90, 80, 70), width=3)

    body = (170, 260, 630, 760)
    draw.rounded_rectangle(body, radius=36, fill=(70, 8, 9), outline=(206, 162, 72), width=6)
    draw.rounded_rectangle((190, 300, 610, 725), radius=32, fill=(120, 10, 18), outline=(230, 180, 90), width=4)

    for x0, x1, fill in [(210, 250, (170, 38, 40)), (320, 360, (120, 20, 24)), (470, 510, (160, 30, 36))]:
        draw.rounded_rectangle((x0, 330, x1, 700), radius=12, fill=fill)

    cap = (190, 160, 610, 270)
    draw.rounded_rectangle(cap, radius=18, fill=(194, 153, 88), outline=(250, 210, 124), width=6)
    draw.rounded_rectangle((220, 145, 580, 175), radius=12, fill=(146, 109, 52), outline=(220, 184, 96), width=5)
    for x in range(210, 590, 40):
        draw.line((x, 188, x + 16, 248), fill=(92, 62, 20), width=4)

    label_box = (230, 395, 570, 630)
    draw.rounded_rectangle(label_box, radius=18, fill=(34, 6, 8), outline=(210, 175, 96), width=4)

    try:
        font_big = ImageFont.truetype("DejaVuSans-Bold.ttf", 58)
        font_small = ImageFont.truetype("DejaVuSans.ttf", 18)
    except Exception:  # noqa: BLE001
        font_big = ImageFont.load_default()
        font_small = ImageFont.load_default()

    draw.text((400, 440), label, font=font_big, fill=(220, 181, 103), anchor="mm")
    draw.text((400, 560), "EAU DE PARFUM", font=font_small, fill=(216, 180, 110), anchor="mm")
    draw.text((400, 590), "OUD & AMBER", font=font_small, fill=(216, 180, 110), anchor="mm")

    for cx, cy, size in [(140, 820, 60), (250, 850, 38), (620, 820, 52), (685, 860, 42)]:
        polygon = [(cx, cy - size), (cx + size * 0.7, cy), (cx, cy + size), (cx - size * 0.7, cy)]
        draw.polygon(polygon, fill=(244, 141, 26), outline=(255, 193, 118), width=3)

    draw.line((250, 330, 280, 700), fill=(255, 255, 255, 120), width=2)
    draw.line((515, 330, 550, 700), fill=(255, 255, 255, 100), width=2)

    path = root / filename
    img.save(path, format="JPEG", quality=92)
    print(f"Created {path} ({path.stat().st_size} bytes)")
