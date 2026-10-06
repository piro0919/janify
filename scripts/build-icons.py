"""アイコンを各サイズに書き出す。`python3 scripts/build-icons.py`

原画は src/assets/icon-source.png（ChatGPT に描かせたもの。2026-10-07）。
暗い地に、ロゴと同じ斜体のセリフ体の「J」を薄紫で、右上に白いきらめき（四芒星）を1つ。
原画を差し替えたら、これを流し直す。要るのは Pillow だけ
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "src/assets/icon-source.png"
# 原画の地色。透過が混じっていても、この色で塗りつぶしてから縮める（globals.css の暗いテーマの地と同じ）
BACKGROUND = (0x0E, 0x0D, 0x12)


def flatten_background(image: Image.Image) -> Image.Image:
    """原画の地は、指定した色からわずかにずれ、細かなむらも乗っている。
    角の色に近い画素をすべて BACKGROUND に塗り直し、サイトや OG 画像の地と継ぎ目なくそろえる"""
    corner = image.getpixel((2, 2))
    out = image.copy()
    pixels = out.load()
    width, height = out.size
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            if abs(r - corner[0]) + abs(g - corner[1]) + abs(b - corner[2]) <= 18:
                pixels[x, y] = BACKGROUND
    return out


def main():
    source = Image.open(SOURCE).convert("RGBA")
    icon = Image.new("RGBA", source.size, BACKGROUND + (255,))
    icon.alpha_composite(source)
    icon = flatten_background(icon.convert("RGB"))

    def resized(size: int) -> Image.Image:
        return icon.resize((size, size), Image.Resampling.LANCZOS)

    # OG 画像（src/app/opengraph-image.tsx）もこれを読む
    resized(512).save(ROOT / "src/app/icon.png")
    resized(180).save(ROOT / "src/app/apple-icon.png")
    # ホーム画面に置いたとき（PWA）のアイコン。src/app/manifest.ts が読む
    for size in (192, 512):
        resized(size).save(ROOT / f"public/icon-{size}x{size}.png")
    # Next.js は中身が RGBA の PNG でない .ico を読めない
    icon.convert("RGBA").save(ROOT / "src/app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])


if __name__ == "__main__":
    main()
