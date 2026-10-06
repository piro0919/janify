"""アイコンを描いて、各サイズに書き出す。`python3 scripts/build-icons.py`

暗い地に薄紫の再生の三角と、白いきらめき（四芒星）を1つ。色は globals.css と同じ。
4倍の大きさで描いてから縮め、縁を滑らかにする。要るのは Pillow だけ
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
BACKGROUND = (0x0E, 0x0D, 0x12)
ACCENT = (0xB6, 0x9B, 0xFF)
FOREGROUND = (0xF3, 0xF2, 0xF7)

SIZE = 1024
SCALE = 4
S = SIZE * SCALE


def rounded_triangle(draw: ImageDraw.ImageDraw, points, radius, fill):
    """角を丸めた三角形。内側に縮めた三角形を、円で膨らませて描く"""
    cx = sum(p[0] for p in points) / 3
    cy = sum(p[1] for p in points) / 3
    inner = []
    for x, y in points:
        dx, dy = x - cx, y - cy
        d = (dx * dx + dy * dy) ** 0.5
        # 頂点から重心へ、辺から radius 離れる分だけ寄せる（正三角形なら頂点では 2r）
        k = (d - 2 * radius) / d
        inner.append((cx + dx * k, cy + dy * k))
    draw.polygon(inner, fill=fill)
    for i in range(3):
        a, b = inner[i], inner[(i + 1) % 3]
        draw.line([a, b], fill=fill, width=int(radius * 2))
    for x, y in inner:
        draw.ellipse([x - radius, y - radius, x + radius, y + radius], fill=fill)


def sparkle(draw: ImageDraw.ImageDraw, center, outer, inner, fill):
    """四芒星。上下左右に尖り、あいだを細く絞る"""
    cx, cy = center
    d = inner * 0.7071
    draw.polygon(
        [
            (cx, cy - outer),
            (cx + d, cy - d),
            (cx + outer, cy),
            (cx + d, cy + d),
            (cx, cy + outer),
            (cx - d, cy + d),
            (cx - outer, cy),
            (cx - d, cy - d),
        ],
        fill=fill,
    )


def draw_icon() -> Image.Image:
    image = Image.new("RGB", (S, S), BACKGROUND)
    draw = ImageDraw.Draw(image)

    # 正三角形の再生ボタン。重心を中央より少し右に置くと、見た目の中心が揃う
    side = S * 0.56
    height = side * 3**0.5 / 2
    cx, cy = S * 0.5 + height * 0.06, S * 0.52
    left = cx - height / 3
    points = [(left, cy - side / 2), (left, cy + side / 2), (left + height, cy)]
    rounded_triangle(draw, points, S * 0.045, ACCENT)

    sparkle(draw, (S * 0.72, S * 0.27), S * 0.10, S * 0.028, FOREGROUND)

    return image.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def main():
    icon = draw_icon()
    # OG 画像（src/app/opengraph-image.tsx）もこれを読む
    icon.resize((512, 512), Image.Resampling.LANCZOS).save(ROOT / "src/app/icon.png")
    icon.resize((180, 180), Image.Resampling.LANCZOS).save(ROOT / "src/app/apple-icon.png")
    # ホーム画面に置いたとき（PWA）のアイコン。src/app/manifest.ts が読む
    for size in (192, 512):
        icon.resize((size, size), Image.Resampling.LANCZOS).save(ROOT / f"public/icon-{size}x{size}.png")
    # Next.js は中身が RGBA の PNG でない .ico を読めない
    icon.convert("RGBA").save(ROOT / "src/app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])


if __name__ == "__main__":
    main()
